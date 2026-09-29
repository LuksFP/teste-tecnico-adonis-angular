import type OrderItem from '#models/order_item'
import { BaseTransformer } from '@adonisjs/core/transformers'
import ProductTransformer from '#transformers/product_transformer'

export default class OrderItemTransformer extends BaseTransformer<OrderItem> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'productId', 'quantity', 'unitPriceCents', 'totalCents']),
      product: ProductTransformer.transform(this.whenLoaded(this.resource.product)),
    }
  }
}
