import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createProduct } from '#tests/helpers'

test.group('Products', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an active product by default', async ({ client }) => {
    const response = await client
      .visit('products.store')
      .json({ name: 'X-Salada', priceCents: 2800 })

    response.assertStatus(201)
    response.assertBodyContains({ data: { name: 'X-Salada', priceCents: 2800, active: true } })
  })

  test('rejects a price that is zero or has decimals', async ({ client }) => {
    const zero = await client.post('/api/v1/products').json({ name: 'Brinde', priceCents: 0 })
    zero.assertStatus(422)

    const decimal = await client.post('/api/v1/products').json({ name: 'Brinde', priceCents: 10.5 })
    decimal.assertStatus(422)
  })

  test('deactivates and reactivates a product', async ({ client }) => {
    const product = await createProduct()

    const off = await client.visit('products.update', { id: product.id }).json({ active: false })
    off.assertStatus(200)
    off.assertBodyContains({ data: { active: false } })

    const on = await client.visit('products.update', { id: product.id }).json({ active: true })
    on.assertBodyContains({ data: { active: true } })
  })

  test('searches products by name', async ({ client, assert }) => {
    await createProduct({ name: 'X-Burger' })
    await createProduct({ name: 'X-Salada' })
    await createProduct({ name: 'Milkshake' })

    const response = await client.visit('products.index').qs({ search: 'x-' })

    assert.deepEqual(
      response.body().data.map((product) => product.name),
      ['X-Burger', 'X-Salada']
    )
  })

  test('editing only the price keeps the other fields', async ({ client }) => {
    const product = await createProduct({ name: 'X-Burger', priceCents: 2500 })

    const response = await client
      .visit('products.update', { id: product.id })
      .json({ priceCents: 2700 })

    response.assertBodyContains({ data: { name: 'X-Burger', priceCents: 2700, active: true } })
  })

  test('filters products by status', async ({ client, assert }) => {
    await createProduct({ name: 'Ativo' })
    await createProduct({ name: 'Inativo', active: false })

    const response = await client.visit('products.index').qs({ active: false })

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((product: { name: string }) => product.name),
      ['Inativo']
    )
  })
})
