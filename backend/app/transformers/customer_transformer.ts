import type Customer from '#models/customer'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class CustomerTransformer extends BaseTransformer<Customer> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'phone', 'createdAt', 'updatedAt'])
  }
}
