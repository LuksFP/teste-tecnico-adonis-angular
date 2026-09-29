import { Component, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  OrderStatus,
  isOrderStatus,
} from '../../core/models/order';
import { OrdersService } from '../../core/services/orders.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Pagination } from '../../shared/ui/pagination';
import { Avatar } from '../../shared/ui/avatar';
import { StatusBadge } from '../../shared/ui/status-badge';
import { TableSkeleton } from '../../shared/ui/table-skeleton';
import { debounced } from '../../shared/utils/debounced';

@Component({
  selector: 'app-orders-page',
  imports: [Avatar, DatePipe, MoneyPipe, Pagination, RouterLink, StatusBadge, TableSkeleton],
  templateUrl: './orders-page.html',
})
export class OrdersPage {
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);

  protected readonly statuses = ORDER_STATUSES;
  protected readonly statusLabel = ORDER_STATUS_LABEL;

  protected readonly search = signal('');
  protected readonly status = signal<OrderStatus | ''>('');
  private readonly searchTerm = debounced(this.search);

  /** Goes back to the first page whenever a filter changes. */
  protected readonly page = linkedSignal({
    source: () => [this.searchTerm(), this.status()],
    computation: () => 1,
  });

  protected readonly orders = rxResource({
    params: () => ({
      page: this.page(),
      search: this.searchTerm(),
      status: this.status() || undefined,
    }),
    stream: ({ params }) => this.ordersService.list(params),
  });

  /** Count per status for the filter chips: the `total` of a one-row page each. */
  protected readonly counts = rxResource({
    stream: () =>
      forkJoin(
        ORDER_STATUSES.map((status) =>
          this.ordersService.list({ status, perPage: 1 }).pipe(map((page) => page.metadata.total)),
        ),
      ).pipe(
        map((totals) => {
          const byStatus = new Map(
            ORDER_STATUSES.map((status, index) => [status, totals[index] ?? 0]),
          );
          return { all: totals.reduce((sum, total) => sum + total, 0), byStatus };
        }),
      ),
  });

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('');
  }

  protected toggleStatus(status: OrderStatus | ''): void {
    this.status.set(this.status() === status ? '' : status);
  }

  protected open(orderId: number): void {
    void this.router.navigate(['/orders', orderId]);
  }
}
