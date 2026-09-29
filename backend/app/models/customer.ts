import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import Order from '#models/order'
import type { SearchScope } from '#models/types'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare phone: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  /**
   * Matches the term against the name or the phone number.
   */
  static search = scope<typeof Customer, SearchScope<typeof Customer>>((query, term) => {
    query.where((builder) => {
      builder.whereLike('name', `%${term}%`).orWhereLike('phone', `%${term}%`)
    })
  })
}
