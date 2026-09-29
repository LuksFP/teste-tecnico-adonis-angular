import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api/api-error';
import {
  ORDER_STATUS_ACTION,
  ORDER_STATUS_LABEL,
  Order,
  OrderStatus,
} from '../../core/models/order';
import { ToastService } from '../../core/notifications/toast.service';
import { OrdersService } from '../../core/services/orders.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { StatusBadge } from '../../shared/ui/status-badge';

const FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];

@Component({
  selector: 'app-order-detail',
  imports: [DatePipe, MoneyPipe, RouterLink, StatusBadge],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly ordersService = inject(OrdersService);
  private readonly toasts = inject(ToastService);

  /** Bound from the `:id` route param. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly flow = FLOW;
  protected readonly statusLabel = ORDER_STATUS_LABEL;
  protected readonly statusAction = ORDER_STATUS_ACTION;
  protected readonly changing = signal<OrderStatus | null>(null);

  protected readonly order = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.ordersService.find(params.id),
  });

  /** Cancel is rendered apart from the forward actions. */
  protected readonly forwardActions = computed(() =>
    (this.order.value()?.nextStatuses ?? []).filter((status) => status !== 'canceled'),
  );
  protected readonly canCancel = computed(
    () => this.order.value()?.nextStatuses.includes('canceled') ?? false,
  );

  protected stepState(order: Order, step: OrderStatus): 'done' | 'current' | 'todo' {
    const current = FLOW.indexOf(order.status);
    const index = FLOW.indexOf(step);
    if (order.status === 'canceled' || index > current) return 'todo';
    return index === current ? 'current' : 'done';
  }

  protected changeStatus(status: OrderStatus): void {
    const order = this.order.value();
    if (!order) return;
    if (
      status === 'canceled' &&
      !window.confirm(`Cancelar o pedido #${order.id}? Isso não pode ser desfeito.`)
    ) {
      return;
    }

    this.changing.set(status);
    this.ordersService.changeStatus(order.id, status, order.status).subscribe({
      next: (updated) => {
        this.changing.set(null);
        this.order.set(updated);
        this.toasts.success(`Pedido #${updated.id}: ${ORDER_STATUS_LABEL[updated.status]}.`);
      },
      error: (error: unknown) => {
        this.changing.set(null);
        this.toasts.error(errorMessage(error));
        this.order.reload();
      },
    });
  }
}
