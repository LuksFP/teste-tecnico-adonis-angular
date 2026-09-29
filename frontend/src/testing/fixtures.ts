import { Customer } from '../app/core/models/customer';
import { Order } from '../app/core/models/order';
import { Page } from '../app/core/models/pagination';
import { Product } from '../app/core/models/product';

/** Test data shaped like the API responses. */
export function page<T>(data: T[]): Page<T> {
  return { data, metadata: { total: data.length, perPage: 100, currentPage: 1, lastPage: 1 } };
}

export function aCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    name: 'Ana Souza',
    phone: '(13) 99812-4410',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

export function aProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'X-Burger',
    priceCents: 2500,
    active: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

export function anOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 7,
    customerId: 1,
    status: 'pending',
    totalCents: 5000,
    createdAt: '2026-09-29T15:00:00.000+00:00',
    updatedAt: '2026-09-29T15:00:00.000+00:00',
    nextStatuses: ['preparing', 'canceled'],
    customer: aCustomer(),
    items: [
      {
        id: 1,
        productId: 1,
        quantity: 2,
        unitPriceCents: 2500,
        totalCents: 5000,
        product: aProduct(),
      },
    ],
    ...overrides,
  };
}

/** Changes a native <select>/<input> the way a user would. */
export function choose(
  element: HTMLSelectElement | HTMLInputElement,
  value: string,
  event = 'change',
): void {
  element.value = value;
  element.dispatchEvent(new Event(event));
}

export function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (!button) throw new Error(`Button "${text}" not found`);
  return button;
}
