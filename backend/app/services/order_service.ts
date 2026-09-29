import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { allowedTransitions, canTransition, type OrderStatus } from '#domain/order_status'
import {
  InactiveProductException,
  InvalidStatusTransitionException,
  OrderStatusChangedException,
  ProductNotFoundException,
} from '#exceptions/order_exceptions'
import Order from '#models/order'
import Product from '#models/product'
import { DEFAULT_PER_PAGE } from '#validators/shared'

export type OrderItemInput = {
  productId: number
  quantity: number
}

export type CreateOrderInput = {
  customerId: number
  items: OrderItemInput[]
}

export type OrderFilters = {
  page?: number
  perPage?: number
  search?: string
  status?: OrderStatus
  customerId?: number
}

export default class OrderService {
  async list(filters: OrderFilters): Promise<ModelPaginatorContract<Order>> {
    const { status, customerId, search } = filters
    const query = Order.query().preload('customer')

    if (status) query.where('status', status)
    if (customerId) query.where('customer_id', customerId)
    if (search) query.withScopes((scopes) => scopes.search(search))

    return query
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(filters.page ?? 1, filters.perPage ?? DEFAULT_PER_PAGE)
  }

  async find(id: number): Promise<Order> {
    return Order.query()
      .where('id', id)
      .preload('customer')
      .preload('items', (items) => items.preload('product').orderBy('id'))
      .firstOrFail()
  }

  /**
   * Order and items are saved in one transaction. Prices come from the database,
   * not the request, and are copied into the items (rule 6).
   */
  async create(input: CreateOrderInput): Promise<Order> {
    const quantities = new Map(input.items.map((item) => [item.productId, item.quantity]))

    const orderId = await db.transaction(async (trx) => {
      const productIds = input.items.map((item) => item.productId)
      const products = await Product.query({ client: trx }).whereIn('id', productIds)
      const productsById = new Map(products.map((product) => [product.id, product]))

      const missing = productIds.filter((id) => !productsById.has(id))
      if (missing.length > 0) {
        throw new ProductNotFoundException(missing)
      }

      const inactive = products.filter((product) => !product.active)
      if (inactive.length > 0) {
        throw new InactiveProductException(inactive)
      }

      const items = products.map((product) => {
        const quantity = quantities.get(product.id) ?? 0
        return {
          productId: product.id,
          quantity,
          unitPriceCents: product.priceCents,
          totalCents: product.priceCents * quantity,
        }
      })

      const order = await Order.create(
        {
          customerId: input.customerId,
          status: 'pending',
          totalCents: items.reduce((sum, item) => sum + item.totalCents, 0),
        },
        { client: trx }
      )
      await order.related('items').createMany(items)

      return order.id
    })

    return this.find(orderId)
  }

  /**
   * `expected` is the status shown on the user's screen. If the order has moved
   * since, the change is refused.
   */
  async changeStatus(id: number, status: OrderStatus, expected?: OrderStatus): Promise<Order> {
    const order = await Order.findOrFail(id)
    if (expected && order.status !== expected) {
      throw new OrderStatusChangedException(order.id)
    }
    await this.transition(order, status)

    return this.find(order.id)
  }

  /**
   * The WHERE on the status that was read makes a concurrent change fail with a
   * conflict instead of overwriting the other one.
   */
  async transition(order: Order, status: OrderStatus): Promise<void> {
    if (!canTransition(order.status, status)) {
      throw new InvalidStatusTransitionException(
        order.status,
        status,
        allowedTransitions(order.status)
      )
    }

    const query = Order.query().where('id', order.id).where('status', order.status)
    const result: unknown = await query.update({
      status,
      updated_at: DateTime.now().toFormat(query.client.dialect.dateTimeFormat),
    })

    if (affectedRows(result) === 0) {
      throw new OrderStatusChangedException(order.id)
    }
  }
}

/** Knex returns the affected rows as a number, or a one-item array on some drivers. */
function affectedRows(result: unknown): number {
  const value = Array.isArray(result) ? result[0] : result
  return typeof value === 'number' ? value : Number(value ?? 0)
}
