import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import { paginationFields } from '#validators/shared'

/** Counts digits only, so "(13) 99999-0000" and "13999990000" are the same. */
const digitCount = vine.createRule(
  (value: unknown, options: { min: number; max: number }, field: FieldContext) => {
    if (typeof value !== 'string') return

    const digits = value.replace(/\D/g, '').length
    if (digits < options.min || digits > options.max) {
      field.report(
        'O telefone deve ter entre {{ min }} e {{ max }} dígitos.',
        'digitCount',
        field,
        options
      )
    }
  }
)

const name = () => vine.string().trim().minLength(2).maxLength(120)

const phone = () =>
  vine
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]+$/)
    .use(digitCount({ min: 10, max: 13 }))

export const createCustomerValidator = vine.create({
  name: name(),
  phone: phone(),
})

export const updateCustomerValidator = vine.create({
  name: name().optional(),
  phone: phone().optional(),
})

export const listCustomersValidator = vine.create({
  ...paginationFields,
})
