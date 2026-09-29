import { computed, signal } from '@angular/core';
import { NewOrderInput } from '../../core/models/order';
import { Product } from '../../core/models/product';

export interface DraftItem {
  product: Product;
  quantity: number;
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 999;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
}

/** Order being put together. Its total is a preview; the API recalculates it. */
export class OrderDraft {
  private readonly lines = signal<DraftItem[]>([]);

  readonly items = this.lines.asReadonly();
  readonly isEmpty = computed(() => this.lines().length === 0);
  readonly itemCount = computed(() => this.lines().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalCents = computed(() =>
    this.lines().reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0),
  );

  /** Adding a product that is already there raises its quantity. */
  add(product: Product, quantity: number): void {
    const existing = this.lines().find((item) => item.product.id === product.id);
    if (existing) {
      this.setQuantity(product.id, existing.quantity + quantity);
      return;
    }
    this.lines.update((items) => [...items, { product, quantity: clampQuantity(quantity) }]);
  }

  setQuantity(productId: number, quantity: number): void {
    this.lines.update((items) =>
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity: clampQuantity(quantity) } : item,
      ),
    );
  }

  remove(productId: number): void {
    this.lines.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.lines.set([]);
  }

  toInput(customerId: number): NewOrderInput {
    return {
      customerId,
      items: this.lines().map(({ product, quantity }) => ({ productId: product.id, quantity })),
    };
  }
}
