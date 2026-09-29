import vine from '@vinejs/vine'

/**
 * Query string fields shared by every paginated listing.
 */
export const paginationFields = {
  page: vine.number().withoutDecimals().min(1).optional(),
  perPage: vine.number().withoutDecimals().range([1, 100]).optional(),
  search: vine.string().trim().maxLength(120).optional(),
}

export const DEFAULT_PER_PAGE = 10
