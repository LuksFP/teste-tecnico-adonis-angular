import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createCustomer, createProduct, invalidFields } from '#tests/helpers'

test.group('API | error responses', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('malformed JSON returns 400 instead of a server error', async ({ client }) => {
    const response = await client.post('/api/v1/customers').unsafeJson('{"name": "Ana"')

    response.assertStatus(400)
    response.assertBodyContains({ error: { code: 'INVALID_JSON' } })
  })

  test('unknown routes return the same error shape', async ({ client }) => {
    const response = await client.get('/api/v1/nothing-here')

    response.assertStatus(404)
    response.assertBodyContains({ error: { code: 'E_ROUTE_NOT_FOUND' } })
  })

  test('a non numeric id does not reach the controller', async ({ client }) => {
    const response = await client.get('/api/v1/orders/abc')

    response.assertStatus(404)
  })

  test('404 for unknown order, product and status change', async ({ client }) => {
    const order = await client.get('/api/v1/orders/999')
    order.assertStatus(404)
    order.assertBodyContains({ error: { code: 'NOT_FOUND' } })

    const product = await client.patch('/api/v1/products/999').json({ active: false })
    product.assertStatus(404)

    const status = await client.patch('/api/v1/orders/999/status').json({ status: 'preparing' })
    status.assertStatus(404)
  })

  test('pages are capped at 100 records', async ({ client, assert }) => {
    const tooBig = await client.get('/api/v1/products').qs({ perPage: 101 })
    tooBig.assertStatus(422)

    const zero = await client.get('/api/v1/orders').qs({ page: 0 })
    zero.assertStatus(422)

    await createProduct()
    const ok = await client.visit('products.index').qs({ perPage: 100 })
    ok.assertStatus(200)
    assert.equal(ok.body().metadata.perPage, 100)
  })

  test('validation errors never leak a stack trace', async ({ client, assert }) => {
    const response = await client.post('/api/v1/products').json({})

    response.assertStatus(422)
    assert.notInclude(JSON.stringify(response.body()), 'stack')
    assert.includeMembers(invalidFields(response.body()), ['name', 'priceCents'])
  })

  test('health check reports the database', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBody({ status: 'ok', database: 'ok' })
  })

  test('customers and products cannot be deleted through the API', async ({ client }) => {
    const customer = await createCustomer()
    const product = await createProduct()

    const deleteCustomer = await client.delete(`/api/v1/customers/${customer.id}`)
    deleteCustomer.assertStatus(404)
    const deleteProduct = await client.delete(`/api/v1/products/${product.id}`)
    deleteProduct.assertStatus(404)
  })
})
