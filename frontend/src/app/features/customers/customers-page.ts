import { Component, inject, linkedSignal, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Customer } from '../../core/models/customer';
import { CustomersService } from '../../core/services/customers.service';
import { Avatar } from '../../shared/ui/avatar';
import { Pagination } from '../../shared/ui/pagination';
import { debounced } from '../../shared/utils/debounced';
import { CustomerForm } from './customer-form';

@Component({
  selector: 'app-customers-page',
  imports: [Avatar, DatePipe, Pagination, CustomerForm],
  template: `
    <header class="page-header">
      <div>
        <p class="eyebrow">Cadastro</p>
        <h1 class="page-title">Clientes</h1>
      </div>
      <button type="button" class="btn btn--primary" (click)="editing.set(null)">
        Novo cliente
      </button>
    </header>

    @if (editing() !== undefined) {
      <app-customer-form
        [customer]="editing() ?? null"
        (saved)="onSaved()"
        (canceled)="editing.set(undefined)"
      />
    }

    <div class="toolbar">
      <label class="field field--grow">
        <span class="sr-only">Buscar cliente</span>
        <input
          #q
          class="input"
          type="search"
          placeholder="Buscar por nome ou telefone"
          [value]="search()"
          (input)="search.set(q.value)"
        />
      </label>
    </div>

    @if (customers.error(); as error) {
      <div class="state state--error">
        <p>{{ error.message }}</p>
        <button type="button" class="btn btn--ghost" (click)="customers.reload()">
          Tentar de novo
        </button>
      </div>
    } @else if (customers.hasValue()) {
      @let result = customers.value();
      <div class="table-wrap" [class.is-loading]="customers.isLoading()">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Telefone</th>
              <th scope="col">Cliente desde</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (customer of result.data; track customer.id) {
              <tr>
                <td>
                  <span class="who"><app-avatar [name]="customer.name" />{{ customer.name }}</span>
                </td>
                <td class="mono">{{ customer.phone }}</td>
                <td>{{ customer.createdAt | date: 'dd/MM/yyyy' }}</td>
                <td class="actions">
                  <button type="button" class="btn btn--link" (click)="editing.set(customer)">
                    Editar
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">Nenhum cliente encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [meta]="result.metadata" (pageChange)="page.set($event)" />
    } @else {
      <p class="state">Carregando clientes…</p>
    }
  `,
})
export class CustomersPage {
  private readonly customersService = inject(CustomersService);

  protected readonly search = signal('');
  private readonly searchTerm = debounced(this.search);
  protected readonly page = linkedSignal({ source: this.searchTerm, computation: () => 1 });

  /** `undefined` = form closed, `null` = creating, a customer = editing. */
  protected readonly editing = signal<Customer | null | undefined>(undefined);

  protected readonly customers = rxResource({
    params: () => ({ page: this.page(), search: this.searchTerm() }),
    stream: ({ params }) => this.customersService.list(params),
  });

  protected onSaved(): void {
    this.editing.set(undefined);
    this.customers.reload();
  }
}
