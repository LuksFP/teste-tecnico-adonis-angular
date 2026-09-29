import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type SearchScope<Model extends LucidModel> = (
  query: ModelQueryBuilderContract<Model>,
  term: string
) => void
