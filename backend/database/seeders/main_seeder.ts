import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type { OrderStatus } from '#domain/order_status'
import Customer from '#models/customer'
import type Order from '#models/order'
import Product from '#models/product'
import OrderService from '#services/order_service'

/** Demo data. Orders go through OrderService, so they follow the API rules. */
export default class extends BaseSeeder {
  async run() {
    if (await Customer.query().first()) {
      return
    }

    const customers = await Customer.createMany([
      { name: 'Ana Souza', phone: '(13) 99812-4410' },
      { name: 'Bruno Lima', phone: '(13) 99745-1022' },
      { name: 'Carla Mendes', phone: '(11) 98233-7781' },
      { name: 'Diego Ferreira', phone: '(13) 3355-2090' },
    ])

    const products = await Product.createMany([
      { name: 'X-Burger', priceCents: 2500, active: true },
      { name: 'X-Salada', priceCents: 2800, active: true },
      { name: 'Batata frita', priceCents: 1400, active: true },
      { name: 'Refrigerante lata', priceCents: 700, active: true },
      { name: 'Milkshake', priceCents: 1800, active: true },
      { name: 'Hot dog especial', priceCents: 1900, active: false },
    ])

    const [ana, bruno, carla, diego] = customers
    const [xBurger, xSalada, batata, refri, milkshake] = products
    const service = new OrderService()

    const plan: { customer: Customer; items: [Product, number][]; walkTo: OrderStatus[] }[] = [
      {
        customer: ana,
        items: [
          [xBurger, 2],
          [refri, 2],
        ],
        walkTo: ['preparing', 'ready', 'completed'],
      },
      {
        customer: bruno,
        items: [
          [xSalada, 1],
          [batata, 1],
        ],
        walkTo: ['preparing', 'ready'],
      },
      { customer: carla, items: [[milkshake, 3]], walkTo: ['preparing'] },
      { customer: diego, items: [[xBurger, 1]], walkTo: ['canceled'] },
      {
        customer: ana,
        items: [
          [batata, 2],
          [refri, 1],
        ],
        walkTo: [],
      },
    ]

    for (const { customer, items, walkTo } of plan) {
      const order: Order = await service.create({
        customerId: customer.id,
        items: items.map(([product, quantity]) => ({ productId: product.id, quantity })),
      })
      for (const status of walkTo) {
        await service.changeStatus(order.id, status)
      }
    }
  }
}
