import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { OrderStatus } from '#domain/order_status'
import Customer from '#models/customer'
import OrderItem from '#models/order_item'
import type { SearchScope } from '#models/types'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customerId: number

  @column()
  declare status: OrderStatus

  /**
   * Always calculated by the backend from the order items.
   */
  @column()
  declare totalCents: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  /**
   * A numeric term also matches the order number. Any term matches the
   * customer name.
   */
  static search = scope<typeof Order, SearchScope<typeof Order>>((query, term) => {
    const orderId = /^\d+$/.test(term) ? Number(term) : null

    query.where((builder) => {
      if (orderId !== null) {
        builder.where('id', orderId)
      }
      builder.orWhereHas('customer', (customerQuery) => {
        customerQuery.whereLike('name', `%${term}%`)
      })
    })
  })
}
