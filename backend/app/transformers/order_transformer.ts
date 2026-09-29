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
      /**
       * Lets the client render only the status actions the API accepts.
       */
      nextStatuses: [...allowedTransitions(this.resource.status)],
      customer: CustomerTransformer.transform(this.whenLoaded(this.resource.customer)),
      /**
       * Items embed their product, one level deeper than the default depth.
       */
      items: OrderItemTransformer.transform(this.whenLoaded(this.resource.items))?.depth(2),
    }
  }
}
