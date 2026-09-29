import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
        .index()
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
        .index()
      table.integer('quantity').unsigned().notNullable()
      /**
       * Snapshot of the product price when the order was placed. Later price
       * changes on the product must not affect existing orders.
       */
      table.integer('unit_price_cents').unsigned().notNullable()
      table.integer('total_cents').unsigned().notNullable()

      table.unique(['order_id', 'product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
