import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Order from '#models/order'
import Product from '#models/product'

export default class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare productId: number

  @column()
  declare quantity: number

  /**
   * Price of the product at the moment the order was created.
   */
  @column()
  declare unitPriceCents: number

  @column()
  declare totalCents: number

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
