import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../api/api-url';
import { toQueryParams } from '../api/query-params';
import { Customer, CustomerInput } from '../models/customer';
import { ListQuery, Page } from '../models/pagination';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/customers`;

  list(query: ListQuery = {}): Observable<Page<Customer>> {
    return this.http.get<Page<Customer>>(this.url, { params: toQueryParams(query) });
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http
      .post<{ data: Customer }>(this.url, input)
      .pipe(map((response) => response.data));
  }

  update(id: number, input: Partial<CustomerInput>): Observable<Customer> {
    return this.http
      .patch<{ data: Customer }>(`${this.url}/${id}`, input)
      .pipe(map((response) => response.data));
  }
}
