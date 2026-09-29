import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderService from '#services/order_service'
import { createCustomer, createProduct, orderIdOf } from '#tests/helpers'

test.group('Orders | creation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('calculates totals on the backend', async ({ client, assert }) => {
    const customer = await createCustomer()
    const burger = await createProduct({ name: 'X-Burger', priceCents: 2500 })
    const soda = await createProduct({ name: 'Refrigerante', priceCents: 700 })

    /**
     * The raw route is used on purpose: a client-sent total must be ignored.
     */
    const created = await client.post('/api/v1/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 2 },
        { productId: soda.id, quantity: 3 },
      ],
      totalCents: 1,
    })
    created.assertStatus(201)

    const response = await client.visit('orders.show', { id: orderIdOf(created.body()) })

    const order = response.body().data
    assert.equal(order.status, 'pending')
    assert.equal(order.totalCents, 2 * 2500 + 3 * 700)
    assert.equal(order.customer?.id, customer.id)
    assert.sameDeepMembers(
      (order.items ?? []).map((item: { productId: number; totalCents: number }) => [
        item.productId,
        item.totalCents,
      ]),
      [
        [burger.id, 5000],
        [soda.id, 2100],
      ]
    )
  })

  test('keeps the price paid when the product price changes later', async ({ client, assert }) => {
    const customer = await createCustomer()
    const burger = await createProduct({ priceCents: 2500 })

    const created = await client.visit('orders.store').json({
      customerId: customer.id,
      items: [{ productId: burger.id, quantity: 2 }],
    })
    const orderId = created.body().data.id

    burger.priceCents = 3000
    await burger.save()

    const response = await client.visit('orders.show', { id: orderId })
    const [item] = response.body().data.items ?? []

    assert.equal(item?.unitPriceCents, 2500)
    assert.equal(item?.totalCents, 5000)
    assert.equal(item?.product?.priceCents, 3000)
    assert.equal(response.body().data.totalCents, 5000)
  })

  test('an order can be placed again after a product is reactivated', async ({ client }) => {
    const customer = await createCustomer()
    const burger = await createProduct({ active: false })
    const payload = { customerId: customer.id, items: [{ productId: burger.id, quantity: 1 }] }

    const refused = await client.post('/api/v1/orders').json(payload)
    refused.assertStatus(422)

    burger.active = true
    await burger.save()

    const accepted = await client.visit('orders.store').json(payload)
    accepted.assertStatus(201)
  })

  test('deactivating a product does not change existing orders', async ({ client, assert }) => {
    const customer = await createCustomer()
    const burger = await createProduct()
    const created = await client
      .visit('orders.store')
      .json({ customerId: customer.id, items: [{ productId: burger.id, quantity: 1 }] })

    burger.active = false
    await burger.save()

    const response = await client.visit('orders.show', { id: created.body().data.id })
    response.assertStatus(200)
    assert.lengthOf(response.body().data.items ?? [], 1)
  })

  test('refuses a quantity above the limit or with decimals', async ({ client }) => {
    const customer = await createCustomer()
    const burger = await createProduct()

    for (const quantity of [1000, 1.5, -1]) {
      const response = await client
        .post('/api/v1/orders')
        .json({ customerId: customer.id, items: [{ productId: burger.id, quantity }] })
      response.assertStatus(422)
    }
  })

  test('refuses the same product twice in one order', async ({ client }) => {
    const customer = await createCustomer()
    const burger = await createProduct()

    const response = await client.post('/api/v1/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: burger.id, quantity: 2 },
      ],
    })

    response.assertStatus(422)
    response.assertBodyContains({ error: { details: [{ field: 'items', rule: 'distinct' }] } })
  })

  test('requires a customer', async ({ client }) => {
    const burger = await createProduct()

    const missing = await client
      .post('/api/v1/orders')
      .json({ items: [{ productId: burger.id, quantity: 1 }] })
    missing.assertStatus(422)

    const unknown = await client
      .post('/api/v1/orders')
      .json({ customerId: 999, items: [{ productId: burger.id, quantity: 1 }] })
    unknown.assertStatus(422)
  })

  test('requires at least one product', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/api/v1/orders')
      .json({ customerId: customer.id, items: [] })

    response.assertStatus(422)
    response.assertBodyContains({
      error: { details: [{ field: 'items', rule: 'array.minLength' }] },
    })
  })

  test('requires a quantity of at least 1', async ({ client }) => {
    const customer = await createCustomer()
    const burger = await createProduct()

    const response = await client
      .post('/api/v1/orders')
      .json({ customerId: customer.id, items: [{ productId: burger.id, quantity: 0 }] })

    response.assertStatus(422)
    response.assertBodyContains({ error: { details: [{ field: 'items.0.quantity' }] } })
  })

  test('refuses inactive products and saves nothing', async ({ client, assert }) => {
    const customer = await createCustomer()
    const burger = await createProduct()
    const hotDog = await createProduct({ name: 'Hot dog', active: false })

    const response = await client.post('/api/v1/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: hotDog.id, quantity: 1 },
      ],
    })

    response.assertStatus(422)
    response.assertBodyContains({
      error: { code: 'PRODUCT_INACTIVE', details: { productIds: [hotDog.id] } },
    })
    assert.lengthOf(await Order.all(), 0)
    assert.lengthOf(await OrderItem.all(), 0)
  })

  test('refuses unknown products', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client
      .post('/api/v1/orders')
      .json({ customerId: customer.id, items: [{ productId: 999, quantity: 1 }] })

    response.assertStatus(422)
    response.assertBodyContains({ error: { code: 'PRODUCT_NOT_FOUND' } })
  })
})

test.group('Orders | status', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function placeOrder() {
    const customer = await createCustomer()
    const product = await createProduct()
    return Order.create({
      customerId: customer.id,
      status: 'pending',
      totalCents: product.priceCents,
    })
  }

  test('walks through the whole flow', async ({ client }) => {
    const order = await placeOrder()

    for (const status of ['preparing', 'ready', 'completed'] as const) {
      const response = await client.visit('orders.updateStatus', { id: order.id }).json({ status })
      response.assertStatus(200)
      response.assertBodyContains({ data: { status } })
    }
  })

  test('tells the client which statuses come next', async ({ client, assert }) => {
    const order = await placeOrder()

    const pending = await client.visit('orders.show', { id: order.id })
    assert.deepEqual(pending.body().data.nextStatuses, ['preparing', 'canceled'])

    await client.visit('orders.updateStatus', { id: order.id }).json({ status: 'canceled' })
    const canceled = await client.visit('orders.show', { id: order.id })
    assert.deepEqual(canceled.body().data.nextStatuses, [])
  })

  test('a completed order cannot be canceled', async ({ client }) => {
    const order = await placeOrder()
    for (const status of ['preparing', 'ready', 'completed'] as const) {
      await client.visit('orders.updateStatus', { id: order.id }).json({ status })
    }

    const response = await client
      .visit('orders.updateStatus', { id: order.id })
      .json({ status: 'canceled' })

    response.assertStatus(409)
  })

  test('does not skip steps', async ({ client }) => {
    const order = await placeOrder()

    const response = await client
      .patch(`/api/v1/orders/${order.id}/status`)
      .json({ status: 'completed' })

    response.assertStatus(409)
    response.assertBodyContains({
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        details: { from: 'pending', allowed: ['preparing', 'canceled'] },
      },
    })
  })

  test('a canceled order cannot move to any other status', async ({ client }) => {
    const order = await placeOrder()
    await client.patch(`/api/v1/orders/${order.id}/status`).json({ status: 'canceled' })

    for (const status of ['pending', 'preparing', 'ready', 'completed']) {
      const response = await client.patch(`/api/v1/orders/${order.id}/status`).json({ status })
      response.assertStatus(409)
    }
  })

  test('a stale status change does not overwrite a newer one', async ({ assert }) => {
    const order = await placeOrder()
    const service = new OrderService()

    /**
     * Two attendants open the same pending order. The first one starts
     * preparing it; the second one, still seeing "pending", tries to cancel.
     */
    const seenByFirst = await Order.findOrFail(order.id)
    const seenBySecond = await Order.findOrFail(order.id)

    await service.transition(seenByFirst, 'preparing')

    await assert.rejects(() => service.transition(seenBySecond, 'canceled'), /mudou de status/)
    await order.refresh()
    assert.equal(order.status, 'preparing')
  })

  test('refuses a change made from an outdated screen', async ({ client, assert }) => {
    const order = await placeOrder()

    /**
     * Attendant A starts preparing the order. Attendant B's screen still says
     * "pending", and B clicks cancel.
     */
    await client
      .visit('orders.updateStatus', { id: order.id })
      .json({ status: 'preparing', from: 'pending' })
    const response = await client
      .visit('orders.updateStatus', { id: order.id })
      .json({ status: 'canceled', from: 'pending' })

    response.assertStatus(409)
    response.assertBodyContains({ error: { code: 'ORDER_STATUS_CHANGED' } })
    await order.refresh()
    assert.equal(order.status, 'preparing')
  })

  test('rejects an unknown status', async ({ client }) => {
    const order = await placeOrder()

    const response = await client
      .patch(`/api/v1/orders/${order.id}/status`)
      .json({ status: 'lost' })

    response.assertStatus(422)
  })
})

test.group('Orders | listing', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists the newest orders first', async ({ client, assert }) => {
    const customer = await createCustomer()
    const older = await Order.create({
      customerId: customer.id,
      status: 'pending',
      totalCents: 100,
    })
    const newer = await Order.create({
      customerId: customer.id,
      status: 'pending',
      totalCents: 200,
    })

    const response = await client.visit('orders.index')

    assert.deepEqual(
      response.body().data.map((order) => order.id),
      [newer.id, older.id]
    )
  })

  test('paginates, filters by status and searches by customer or number', async ({
    client,
    assert,
  }) => {
    const ana = await createCustomer({ name: 'Ana Souza' })
    const bruno = await createCustomer({ name: 'Bruno Lima' })
    const first = await Order.create({ customerId: ana.id, status: 'pending', totalCents: 100 })
    await Order.create({ customerId: bruno.id, status: 'ready', totalCents: 200 })
    await Order.create({ customerId: bruno.id, status: 'pending', totalCents: 300 })

    const page = await client.visit('orders.index').qs({ perPage: 2 })
    assert.lengthOf(page.body().data, 2)
    assert.equal(page.body().metadata.total, 3)
    assert.equal(page.body().metadata.lastPage, 2)

    const pending = await client.visit('orders.index').qs({ status: 'pending' })
    assert.lengthOf(pending.body().data, 2)

    const byName = await client.visit('orders.index').qs({ search: 'bruno', status: 'ready' })
    assert.deepEqual(
      byName.body().data.map((order) => order.customer?.name),
      ['Bruno Lima']
    )

    const byNumber = await client.visit('orders.index').qs({ search: String(first.id) })
    assert.equal(byNumber.body().data[0]?.id, first.id)

    const byCustomer = await client.visit('orders.index').qs({ customerId: bruno.id })
    assert.lengthOf(byCustomer.body().data, 2)
    assert.isTrue(byCustomer.body().data.every((order) => order.customerId === bruno.id))
  })
})
