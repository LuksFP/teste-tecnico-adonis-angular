import { ListQuery } from './pagination';

export interface Product {
  id: number;
  name: string;
  /** Price in cents: R$ 25,00 is 2500. */
  priceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  priceCents: number;
  active: boolean;
}

export interface ProductQuery extends ListQuery {
  active?: boolean;
}
