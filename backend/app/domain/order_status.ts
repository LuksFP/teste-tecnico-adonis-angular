/**
 * Order lifecycle.
 *
 * pending → preparing → ready → completed
 *
 * Any order that is not finished yet can be canceled. "completed" and
 * "canceled" are final: once there, the status never changes again.
 */
export const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'canceled'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

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
