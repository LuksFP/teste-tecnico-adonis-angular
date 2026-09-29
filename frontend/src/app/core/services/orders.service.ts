import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../api/api-url';
import { toQueryParams } from '../api/query-params';
import { NewOrderInput, Order, OrderQuery, OrderStatus } from '../models/order';
import { Page } from '../models/pagination';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/orders`;

  list(query: OrderQuery = {}): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(this.url, { params: toQueryParams(query) });
  }

  find(id: number): Observable<Order> {
    return this.http
      .get<{ data: Order }>(`${this.url}/${id}`)
      .pipe(map((response) => response.data));
  }

  create(input: NewOrderInput): Observable<Order> {
    return this.http.post<{ data: Order }>(this.url, input).pipe(map((response) => response.data));
  }

  /**
   * `from` is the status shown on screen; the API refuses the change if the
   * order has moved since, instead of acting on outdated information.
   */
  changeStatus(id: number, status: OrderStatus, from: OrderStatus): Observable<Order> {
    return this.http
      .patch<{ data: Order }>(`${this.url}/${id}/status`, { status, from })
      .pipe(map((response) => response.data));
  }
}
