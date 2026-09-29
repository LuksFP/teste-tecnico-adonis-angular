import { Component, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { errorMessage } from '../../core/api/api-error';
import { ToastService } from '../../core/notifications/toast.service';
import { Product } from '../../core/models/product';
import { ProductsService } from '../../core/services/products.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Pagination } from '../../shared/ui/pagination';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { debounced } from '../../shared/utils/debounced';
import { ProductForm } from './product-form';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-products-page',
  imports: [MoneyPipe, Pagination, ProductForm, TableSkeleton],
  templateUrl: './products-page.html',
})
export class ProductsPage {
  private readonly productsService = inject(ProductsService);
  private readonly toasts = inject(ToastService);

  protected readonly activeOptions: { value: ActiveFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' },
  ];

  protected readonly search = signal('');
  protected readonly activeFilter = signal<ActiveFilter>('all');
  private readonly searchTerm = debounced(this.search);

  /** Goes back to the first page whenever a filter changes. */
  protected readonly page = linkedSignal({
    source: () => [this.searchTerm(), this.activeFilter()],
    computation: () => 1,
  });

  /** `undefined` = form closed, `null` = creating, a product = editing. */
  protected readonly editing = signal<Product | null | undefined>(undefined);
  protected readonly toggling = signal<number | null>(null);

  protected readonly products = rxResource({
    params: () => ({
      page: this.page(),
      search: this.searchTerm(),
      active: this.activeFilter() === 'all' ? undefined : this.activeFilter() === 'active',
    }),
    stream: ({ params }) => this.productsService.list(params),
  });

  protected clearFilters(): void {
    this.search.set('');
    this.activeFilter.set('all');
  }

  protected onSaved(): void {
    this.editing.set(undefined);
    this.products.reload();
  }

  protected toggleActive(product: Product): void {
    this.toggling.set(product.id);
    this.productsService.setActive(product.id, !product.active).subscribe({
      next: (updated) => {
        this.toggling.set(null);
        this.toasts.success(`${updated.name} ${updated.active ? 'ativado' : 'desativado'}.`);
        this.products.reload();
      },
      error: (error: unknown) => {
        this.toggling.set(null);
        this.toasts.error(errorMessage(error));
      },
    });
  }
}
