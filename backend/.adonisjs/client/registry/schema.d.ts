/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'customers.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customer').listCustomersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.store': {
    methods: ["POST"]
    pattern: '/api/v1/customers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer').createCustomerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer').createCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/customers/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['show']>>>
    }
  }
  'customers.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/v1/customers/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer').updateCustomerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customer').updateCustomerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/product').listProductsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.store': {
    methods: ["POST"]
    pattern: '/api/v1/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product').createProductValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product').createProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
    }
  }
  'products.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/v1/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product').updateProductValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product').updateProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/order').listOrdersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.store': {
    methods: ["POST"]
    pattern: '/api/v1/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order').createOrderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/order').createOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
    }
  }
  'orders.updateStatus': {
    methods: ["PATCH"]
    pattern: '/api/v1/orders/:id/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order').updateOrderStatusValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/order').updateOrderStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateStatus']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['updateStatus']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
