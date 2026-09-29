import Customer from '#models/customer'
import Product from '#models/product'

/**
 * Small builders so each test only spells out the fields it cares about.
 */
export function createCustomer(overrides: Partial<Pick<Customer, 'name' | 'phone'>> = {}) {
  return Customer.create({ name: 'Ana Souza', phone: '(13) 99812-4410', ...overrides })
}

export function createProduct(
  overrides: Partial<Pick<Product, 'name' | 'priceCents' | 'active'>> = {}
) {
  return Product.create({ name: 'X-Burger', priceCents: 2500, active: true, ...overrides })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Fields reported in a `VALIDATION_ERROR` response body.
 */
export function invalidFields(body: unknown): string[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.details)) {
    return []
  }
  return body.error.details.flatMap((detail: unknown) =>
    isRecord(detail) && typeof detail.field === 'string' ? [detail.field] : []
  )
}

/**
 * Id of the order in a `{ data: { id } }` response body.
 */
export function orderIdOf(body: unknown): number {
  if (isRecord(body) && isRecord(body.data) && typeof body.data.id === 'number') {
    return body.data.id
  }
  throw new Error('Response body does not contain an order id')
}
