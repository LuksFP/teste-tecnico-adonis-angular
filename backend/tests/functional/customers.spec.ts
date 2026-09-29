import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createCustomer, invalidFields } from '#tests/helpers'

test.group('Customers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a customer', async ({ client }) => {
    const response = await client
      .visit('customers.store')
      .json({ name: '  Bruno Lima ', phone: '(13) 99745-1022' })

    response.assertStatus(201)
    response.assertBodyContains({ data: { name: 'Bruno Lima', phone: '(13) 99745-1022' } })
  })

  test('rejects a customer without name and with an invalid phone', async ({ client, assert }) => {
    const response = await client.post('/api/v1/customers').json({ phone: '1234' })

    response.assertStatus(422)
    response.assertBodyContains({ error: { code: 'VALIDATION_ERROR' } })
    assert.includeMembers(invalidFields(response.body()), ['name', 'phone'])
  })

  test('accepts the usual ways of writing a phone number', async ({ client }) => {
    for (const phone of ['(13) 99812-4410', '13998124410', '+55 13 99812-4410', '13 3355-2090']) {
      const response = await client.post('/api/v1/customers').json({ name: 'Ana Souza', phone })
      response.assertStatus(201)
    }
  })

  test('rejects phones with letters or the wrong number of digits', async ({ client, assert }) => {
    for (const phone of ['13 9981A-4410', '99812-44', '+55 13 99812-4410 1234']) {
      const response = await client.post('/api/v1/customers').json({ name: 'Ana Souza', phone })
      response.assertStatus(422)
      assert.deepEqual(invalidFields(response.body()), ['phone'])
    }
  })

  test('updates a customer', async ({ client }) => {
    const customer = await createCustomer()

    const response = await client
      .visit('customers.update', { id: customer.id })
      .json({ phone: '(11) 98888-7777' })

    response.assertStatus(200)
    response.assertBodyContains({ data: { name: 'Ana Souza', phone: '(11) 98888-7777' } })
  })

  test('lists customers paginated and filtered by search', async ({ client, assert }) => {
    await createCustomer({ name: 'Ana Souza' })
    await createCustomer({ name: 'Bruno Lima' })
    await createCustomer({ name: 'Carla Mendes' })

    const response = await client.visit('customers.index').qs({ search: 'lima', perPage: 1 })

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].name, 'Bruno Lima')
    assert.equal(response.body().metadata.total, 1)
  })

  test('returns 404 for an unknown customer', async ({ client }) => {
    const response = await client.visit('customers.show', { id: 999 })

    response.assertStatus(404)
    response.assertBodyContains({ error: { code: 'NOT_FOUND' } })
  })
})
