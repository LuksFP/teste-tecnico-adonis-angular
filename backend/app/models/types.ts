import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

/**
 * Signature of the "search" query scope shared by the models.
 */
export type SearchScope<Model extends LucidModel> = (
  query: ModelQueryBuilderContract<Model>,
  term: string
) => void
