import { DateTime } from 'luxon'
import { BaseModel, column, scope } from '@adonisjs/lucid/orm'
import type { SearchScope } from '#models/types'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare priceCents: number

  /**
   * SQLite returns booleans as 0/1, so the value is cast when read.
   */
  @column({ consume: (value: unknown) => Boolean(value) })
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static search = scope<typeof Product, SearchScope<typeof Product>>((query, term) => {
    query.whereLike('name', `%${term}%`)
  })
}
