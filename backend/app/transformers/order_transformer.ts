import type Order from '#models/order'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { allowedTransitions } from '#domain/order_status'
import CustomerTransformer from '#transformers/customer_transformer'
import OrderItemTransformer from '#transformers/order_item_transformer'

export default class OrderTransformer extends BaseTransformer<Order> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'customerId',
        'status',
        'totalCents',
        'createdAt',
        'updatedAt',
      ]),
      /** The client builds the status buttons from this. */
      nextStatuses: [...allowedTransitions(this.resource.status)],
      customer: CustomerTransformer.transform(this.whenLoaded(this.resource.customer)),
      /** Nested transformers stop at depth 1 by default; items need 2 to include the product. */
      items: OrderItemTransformer.transform(this.whenLoaded(this.resource.items))?.depth(2),
    }
  }
}
