import { Product } from '../../core/models/product';
import { MAX_QUANTITY, OrderDraft } from './order-draft';

function product(id: number, priceCents: number): Product {
  return { id, name: `Produto ${id}`, priceCents, active: true, createdAt: '', updatedAt: '' };
}

describe('OrderDraft', () => {
  it('starts empty', () => {
    const draft = new OrderDraft();
    expect(draft.isEmpty()).toBe(true);
    expect(draft.totalCents()).toBe(0);
  });

  it('adds products and previews the total', () => {
    const draft = new OrderDraft();
    draft.add(product(1, 2500), 2);
    draft.add(product(2, 700), 3);

    expect(draft.items().length).toBe(2);
    expect(draft.itemCount()).toBe(5);
    expect(draft.totalCents()).toBe(2 * 2500 + 3 * 700);
  });

  it('adding the same product again sums the quantity', () => {
    const draft = new OrderDraft();
    draft.add(product(1, 2500), 1);
    draft.add(product(1, 2500), 2);

    expect(draft.items()).toEqual([{ product: product(1, 2500), quantity: 3 }]);
  });

  it('keeps quantities between 1 and the maximum', () => {
    const draft = new OrderDraft();
    draft.add(product(1, 100), 1);

    draft.setQuantity(1, 0);
    expect(draft.items()[0]?.quantity).toBe(1);

    draft.setQuantity(1, Number.NaN);
    expect(draft.items()[0]?.quantity).toBe(1);

    draft.setQuantity(1, MAX_QUANTITY + 50);
    expect(draft.items()[0]?.quantity).toBe(MAX_QUANTITY);
  });

  it('removes products', () => {
    const draft = new OrderDraft();
    draft.add(product(1, 100), 1);
    draft.add(product(2, 100), 1);

    draft.remove(1);

    expect(draft.items().map((item) => item.product.id)).toEqual([2]);
  });

  it('builds the API payload with ids and quantities only', () => {
    const draft = new OrderDraft();
    draft.add(product(1, 2500), 2);

    expect(draft.toInput(7)).toEqual({ customerId: 7, items: [{ productId: 1, quantity: 2 }] });
  });
});
