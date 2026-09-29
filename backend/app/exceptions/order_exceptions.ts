import { ORDER_STATUS_LABEL, type OrderStatus } from '#domain/order_status'
import DomainException from '#exceptions/domain_exception'

export class ProductNotFoundException extends DomainException {
  constructor(productIds: number[]) {
    const message =
      productIds.length === 1
        ? `O produto ${productIds[0]} não existe.`
        : `Estes produtos não existem: ${productIds.join(', ')}.`
    super(message, 'PRODUCT_NOT_FOUND', { productIds })
  }
}

export class InactiveProductException extends DomainException {
  constructor(products: { id: number; name: string }[]) {
    const names = products.map((product) => product.name)
    const message =
      names.length === 1
        ? `${names[0]} está inativo e não pode entrar em pedido novo.`
        : `Estes produtos estão inativos e não podem entrar em pedido novo: ${names.join(', ')}.`
    super(message, 'PRODUCT_INACTIVE', { productIds: products.map((product) => product.id) })
  }
}

export class InvalidStatusTransitionException extends DomainException {
  static status = 409

  constructor(from: OrderStatus, to: OrderStatus, allowed: readonly OrderStatus[]) {
    const message =
      allowed.length === 0
        ? `O pedido está ${ORDER_STATUS_LABEL[from].toLowerCase()} e não muda mais de status.`
        : `Um pedido ${ORDER_STATUS_LABEL[from].toLowerCase()} não pode ir para ${ORDER_STATUS_LABEL[to].toLowerCase()}.`
    super(message, 'INVALID_STATUS_TRANSITION', { from, to, allowed: [...allowed] })
  }
}

export class OrderStatusChangedException extends DomainException {
  static status = 409

  constructor(orderId: number) {
    super(
      `O pedido #${orderId} mudou de status antes desta alteração. Confira o status atual e tente de novo.`,
      'ORDER_STATUS_CHANGED'
    )
  }
}
