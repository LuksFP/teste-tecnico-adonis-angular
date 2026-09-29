import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiError, errorMessage } from '../../core/api/api-error';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { ToastService } from '../../core/notifications/toast.service';
import { CustomersService } from '../../core/services/customers.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { MAX_QUANTITY, MIN_QUANTITY, OrderDraft } from './order-draft';

/** The API caps a page at 100 records, which covers a small shop's catalog. */
const OPTIONS_LIMIT = 100;

@Component({
  selector: 'app-new-order',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './new-order.html',
})
export class NewOrder implements HasUnsavedChanges {
  private readonly ordersService = inject(OrdersService);
  private readonly customersService = inject(CustomersService);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly minQuantity = MIN_QUANTITY;
  protected readonly maxQuantity = MAX_QUANTITY;
  protected readonly draft = new OrderDraft();

  protected readonly customers = rxResource({
    stream: () => this.customersService.list({ perPage: OPTIONS_LIMIT }),
  });
  /** Only active products can go into a new order. */
  protected readonly products = rxResource({
    stream: () => this.productsService.list({ active: true, perPage: OPTIONS_LIMIT }),
  });

  protected readonly customerId = signal<number | null>(null);
  protected readonly productId = signal<number | null>(null);
  protected readonly quantity = signal(1);

  protected readonly submitting = signal(false);
  private readonly submitted = signal(false);
  private readonly attempted = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected readonly customer = computed(() =>
    this.customers.value()?.data.find((customer) => customer.id === this.customerId()),
  );
  private readonly selectedProduct = computed(() =>
    this.products.value()?.data.find((product) => product.id === this.productId()),
  );

  protected readonly missingCustomer = computed(
    () => this.attempted() && this.customerId() === null,
  );
  protected readonly missingItems = computed(() => this.attempted() && this.draft.isEmpty());

  hasUnsavedChanges(): boolean {
    return !this.submitted() && !this.draft.isEmpty();
  }

  protected selectCustomer(value: string): void {
    this.customerId.set(value ? Number(value) : null);
  }

  protected selectProduct(value: string): void {
    this.productId.set(value ? Number(value) : null);
  }

  protected addItem(): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.draft.add(product, this.quantity());
    this.productId.set(null);
    this.quantity.set(1);
  }

  protected submit(): void {
    this.attempted.set(true);
    const customerId = this.customerId();
    if (customerId === null || this.draft.isEmpty()) return;

    this.submitting.set(true);
    this.apiError.set(null);
    this.ordersService.create(this.draft.toInput(customerId)).subscribe({
      next: (order) => {
        this.submitted.set(true);
        this.toasts.success(`Pedido #${order.id} criado.`);
        void this.router.navigate(['/orders', order.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.apiError.set(this.describe(error));
        if (error instanceof ApiError && error.code === 'PRODUCT_INACTIVE') {
          this.products.reload();
        }
      },
    });
  }

  private describe(error: unknown): string {
    if (error instanceof ApiError && error.isValidation && error.fieldErrors.length > 0) {
      return error.fieldErrors.map((fieldError) => fieldError.message).join(' ');
    }
    return errorMessage(error);
  }
}
