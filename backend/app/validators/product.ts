import vine from '@vinejs/vine'
import { paginationFields } from '#validators/shared'

const name = () => vine.string().trim().minLength(2).maxLength(120)

/**
 * Price in cents: R$ 25,00 is sent as 2500.
 */
const priceCents = () => vine.number().withoutDecimals().range([1, 100_000_000])

export const createProductValidator = vine.create({
  name: name(),
  priceCents: priceCents(),
  active: vine.boolean().optional(),
})

export const updateProductValidator = vine.create({
  name: name().optional(),
  priceCents: priceCents().optional(),
  active: vine.boolean().optional(),
})

export const listProductsValidator = vine.create({
  ...paginationFields,
  active: vine.boolean().optional(),
})
