/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'customers.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customers',
    tokens: [{"old":"/api/v1/customers","type":0,"val":"api","end":""},{"old":"/api/v1/customers","type":0,"val":"v1","end":""},{"old":"/api/v1/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['customers.index']['types'],
  },
  'customers.store': {
    methods: ["POST"],
    pattern: '/api/v1/customers',
    tokens: [{"old":"/api/v1/customers","type":0,"val":"api","end":""},{"old":"/api/v1/customers","type":0,"val":"v1","end":""},{"old":"/api/v1/customers","type":0,"val":"customers","end":""}],
    types: placeholder as Registry['customers.store']['types'],
  },
  'customers.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/customers/:id',
    tokens: [{"old":"/api/v1/customers/:id","type":0,"val":"api","end":""},{"old":"/api/v1/customers/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/customers/:id","type":0,"val":"customers","end":""},{"old":"/api/v1/customers/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['customers.show']['types'],
  },
  'customers.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/v1/customers/:id',
    tokens: [{"old":"/api/v1/customers/:id","type":0,"val":"api","end":""},{"old":"/api/v1/customers/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/customers/:id","type":0,"val":"customers","end":""},{"old":"/api/v1/customers/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['customers.update']['types'],
  },
  'products.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products',
    tokens: [{"old":"/api/v1/products","type":0,"val":"api","end":""},{"old":"/api/v1/products","type":0,"val":"v1","end":""},{"old":"/api/v1/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.index']['types'],
  },
  'products.store': {
    methods: ["POST"],
    pattern: '/api/v1/products',
    tokens: [{"old":"/api/v1/products","type":0,"val":"api","end":""},{"old":"/api/v1/products","type":0,"val":"v1","end":""},{"old":"/api/v1/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.store']['types'],
  },
  'products.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/products/:id',
    tokens: [{"old":"/api/v1/products/:id","type":0,"val":"api","end":""},{"old":"/api/v1/products/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/products/:id","type":0,"val":"products","end":""},{"old":"/api/v1/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.show']['types'],
  },
  'products.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/v1/products/:id',
    tokens: [{"old":"/api/v1/products/:id","type":0,"val":"api","end":""},{"old":"/api/v1/products/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/products/:id","type":0,"val":"products","end":""},{"old":"/api/v1/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.update']['types'],
  },
  'orders.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/orders',
    tokens: [{"old":"/api/v1/orders","type":0,"val":"api","end":""},{"old":"/api/v1/orders","type":0,"val":"v1","end":""},{"old":"/api/v1/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['orders.index']['types'],
  },
  'orders.store': {
    methods: ["POST"],
    pattern: '/api/v1/orders',
    tokens: [{"old":"/api/v1/orders","type":0,"val":"api","end":""},{"old":"/api/v1/orders","type":0,"val":"v1","end":""},{"old":"/api/v1/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['orders.store']['types'],
  },
  'orders.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/orders/:id',
    tokens: [{"old":"/api/v1/orders/:id","type":0,"val":"api","end":""},{"old":"/api/v1/orders/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/orders/:id","type":0,"val":"orders","end":""},{"old":"/api/v1/orders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['orders.show']['types'],
  },
  'orders.updateStatus': {
    methods: ["PATCH"],
    pattern: '/api/v1/orders/:id/status',
    tokens: [{"old":"/api/v1/orders/:id/status","type":0,"val":"api","end":""},{"old":"/api/v1/orders/:id/status","type":0,"val":"v1","end":""},{"old":"/api/v1/orders/:id/status","type":0,"val":"orders","end":""},{"old":"/api/v1/orders/:id/status","type":1,"val":"id","end":""},{"old":"/api/v1/orders/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['orders.updateStatus']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
