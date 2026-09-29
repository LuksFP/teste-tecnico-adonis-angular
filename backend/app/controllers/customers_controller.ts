import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import CustomerTransformer from '#transformers/customer_transformer'
import {
  createCustomerValidator,
  listCustomersValidator,
  updateCustomerValidator,
} from '#validators/customer'
import { DEFAULT_PER_PAGE } from '#validators/shared'

export default class CustomersController {
  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(listCustomersValidator, { data: request.qs() })

    const { search } = filters
    const query = Customer.query()

    if (search) query.withScopes((scopes) => scopes.search(search))

    const customers = await query
      .orderBy('name')
      .paginate(filters.page ?? 1, filters.perPage ?? DEFAULT_PER_PAGE)
    customers.baseUrl(request.url())

    return serialize(CustomerTransformer.paginate(customers.all(), customers.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    return serialize(CustomerTransformer.transform(customer))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createCustomerValidator)
    const customer = await Customer.create(payload)

    response.status(201)
    return serialize(CustomerTransformer.transform(customer))
  }

  async update({ params, request, serialize }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    const payload = await request.validateUsing(updateCustomerValidator)

    await customer.merge(payload).save()
    return serialize(CustomerTransformer.transform(customer))
  }
}
