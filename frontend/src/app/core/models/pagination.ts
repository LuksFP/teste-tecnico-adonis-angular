export interface PageMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface Page<T> {
  data: T[];
  metadata: PageMeta;
}

export interface ListQuery {
  page?: number;
  perPage?: number;
  search?: string;
}
