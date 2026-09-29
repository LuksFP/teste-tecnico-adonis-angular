import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../api/api-url';
import { toQueryParams } from '../api/query-params';
import { Page } from '../models/pagination';
import { Product, ProductInput, ProductQuery } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/products`;

  list(query: ProductQuery = {}): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(this.url, { params: toQueryParams(query) });
  }

  create(input: ProductInput): Observable<Product> {
    return this.http
      .post<{ data: Product }>(this.url, input)
      .pipe(map((response) => response.data));
  }

  update(id: number, input: Partial<ProductInput>): Observable<Product> {
    return this.http
      .patch<{ data: Product }>(`${this.url}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  setActive(id: number, active: boolean): Observable<Product> {
    return this.update(id, { active });
  }
}
