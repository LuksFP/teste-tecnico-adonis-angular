/**
 * pending → preparing → ready → completed. Anything not finished can be
 * canceled; completed and canceled are final.
 */
export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'canceled'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Status names as they appear in error messages. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Em preparação',
  ready: 'Pronto',
  completed: 'Finalizado',
  canceled: 'Cancelado',
}

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['preparing', 'canceled'],
  preparing: ['ready', 'canceled'],
  ready: ['completed', 'canceled'],
  completed: [],
  canceled: [],
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function isFinalStatus(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0
}
