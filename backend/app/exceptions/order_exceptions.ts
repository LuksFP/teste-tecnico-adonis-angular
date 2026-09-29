import type { OrderStatus } from '#domain/order_status'
import DomainException from '#exceptions/domain_exception'

export class ProductNotFoundException extends DomainException {
  constructor(productIds: number[]) {
    super(`Produto(s) não encontrado(s): ${productIds.join(', ')}.`, 'PRODUCT_NOT_FOUND', {
      productIds,
    })
  }
}

export class InactiveProductException extends DomainException {
  constructor(products: { id: number; name: string }[]) {
    const names = products.map((product) => product.name).join(', ')
    super(
      `Produto(s) inativo(s) não podem entrar em novos pedidos: ${names}.`,
      'PRODUCT_INACTIVE',
      {
        productIds: products.map((product) => product.id),
      }
    )
  }
}

export class InvalidStatusTransitionException extends DomainException {
  static status = 409

  constructor(from: OrderStatus, to: OrderStatus, allowed: readonly OrderStatus[]) {
    super(`Não é possível mudar o pedido de "${from}" para "${to}".`, 'INVALID_STATUS_TRANSITION', {
      from,
      to,
      allowed: [...allowed],
    })
  }
}

export class OrderStatusChangedException extends DomainException {
  static status = 409

  constructor(orderId: number) {
    super(
      `O pedido #${orderId} mudou de status enquanto esta alteração era feita. Atualize e tente de novo.`,
      'ORDER_STATUS_CHANGED'
    )
  }
}
