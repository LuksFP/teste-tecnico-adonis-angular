import { Customer } from './customer';
import { ListQuery } from './pagination';
import { Product } from './product';

export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'canceled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Em preparação',
  ready: 'Pronto',
  completed: 'Finalizado',
  canceled: 'Cancelado',
};

/** Button text for moving an order into each status. */
export const ORDER_STATUS_ACTION: Record<OrderStatus, string> = {
  pending: 'Voltar para pendente',
  preparing: 'Iniciar preparo',
  ready: 'Marcar como pronto',
  completed: 'Finalizar pedido',
  canceled: 'Cancelar pedido',
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  /** Price paid per unit, frozen when the order was created. */
  unitPriceCents: number;
  totalCents: number;
  product?: Product;
}

export interface Order {
  id: number;
  customerId: number;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  /** Statuses the API accepts from the current one. */
  nextStatuses: OrderStatus[];
  customer?: Customer;
  items?: OrderItem[];
}

export interface NewOrderInput {
  customerId: number;
  items: { productId: number; quantity: number }[];
}

export interface OrderQuery extends ListQuery {
  status?: OrderStatus;
  customerId?: number;
}
