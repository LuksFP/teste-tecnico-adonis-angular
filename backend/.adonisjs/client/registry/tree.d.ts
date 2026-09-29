/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  customers: {
    index: typeof routes['customers.index']
    store: typeof routes['customers.store']
    show: typeof routes['customers.show']
    update: typeof routes['customers.update']
  }
  products: {
    index: typeof routes['products.index']
    store: typeof routes['products.store']
    show: typeof routes['products.show']
    update: typeof routes['products.update']
  }
  orders: {
    index: typeof routes['orders.index']
    store: typeof routes['orders.store']
    show: typeof routes['orders.show']
    updateStatus: typeof routes['orders.updateStatus']
  }
}
