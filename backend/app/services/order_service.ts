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
   * Creates the order and its items in a single transaction. Prices come
   * from the database, never from the request, and are copied into each
   * item so later price changes do not touch this order.
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
   * `expected` is the status the person saw on screen. If the order moved
   * since then, the change is refused so nobody acts on outdated information.
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
   * Moves an already loaded order to `status`. The UPDATE only matches while
   * the row still has the status that was read, so when two people change the
   * same order at the same time the second one gets a conflict instead of
   * silently overwriting the first.
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

/**
 * Knex returns the affected row count as a number or, on some drivers, as a
 * one-item array.
 */
function affectedRows(result: unknown): number {
  const value = Array.isArray(result) ? result[0] : result
  return typeof value === 'number' ? value : Number(value ?? 0)
}
