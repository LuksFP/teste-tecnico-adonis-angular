import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import OrderTransformer from '#transformers/order_transformer'
import {
  createOrderValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
} from '#validators/order'

@inject()
export default class OrdersController {
  constructor(private orderService: OrderService) {}

  async index({ request, serialize }: HttpContext) {
    const filters = await request.validateUsing(listOrdersValidator, { data: request.qs() })
    const orders = await this.orderService.list(filters)
    orders.baseUrl(request.url())

    return serialize(OrderTransformer.paginate(orders.all(), orders.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const order = await this.orderService.find(params.id)
    return serialize(OrderTransformer.transform(order))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(createOrderValidator)
    const order = await this.orderService.create(payload)

    response.status(201)
    return serialize(OrderTransformer.transform(order))
  }

  async updateStatus({ params, request, serialize }: HttpContext) {
    const { status, from } = await request.validateUsing(updateOrderStatusValidator)
    const order = await this.orderService.changeStatus(params.id, status, from)

    return serialize(OrderTransformer.transform(order))
  }
}
