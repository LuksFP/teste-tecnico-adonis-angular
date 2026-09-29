import vine from '@vinejs/vine'
import { ORDER_STATUSES } from '#domain/order_status'
import { paginationFields } from '#validators/shared'

const id = () => vine.number().withoutDecimals().positive()

export const createOrderValidator = vine.create({
  customerId: id().exists({ table: 'customers', column: 'id' }),
  items: vine
    .array(
      vine.object({
        productId: id(),
        quantity: vine.number().withoutDecimals().range([1, 999]),
      })
    )
    .minLength(1)
    .distinct('productId'),
})

export const updateOrderStatusValidator = vine.create({
  status: vine.enum(ORDER_STATUSES),
  /** Status shown on the client. Refused with 409 if the order is no longer in it. */
  from: vine.enum(ORDER_STATUSES).optional(),
})

export const listOrdersValidator = vine.create({
  ...paginationFields,
  status: vine.enum(ORDER_STATUSES).optional(),
  customerId: id().optional(),
})
