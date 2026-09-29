import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import {
  aCustomer,
  aProduct,
  anOrder,
  buttonByText,
  choose,
  page,
} from '../../../testing/fixtures';
import { NewOrder } from './new-order';

describe('NewOrder', () => {
  let fixture: ComponentFixture<NewOrder>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const burger = aProduct({ id: 1, name: 'X-Burger', priceCents: 2500 });
  const soda = aProduct({ id: 2, name: 'Refrigerante', priceCents: 700 });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(NewOrder);
    root = fixture.nativeElement;
    // Runs the resources' effects so their requests go out; whenStable()
    // would wait for those requests forever.
    TestBed.tick();
    http.expectOne((request) => request.url === '/api/v1/customers').flush(page([aCustomer()]));
    const products = http.expectOne((request) => request.url === '/api/v1/products');
    expect(products.request.params.get('active')).toBe('true');
    products.flush(page([burger, soda]));
    await fixture.whenStable();
  }

  async function add(productId: number, quantity: number): Promise<void> {
    const [, productSelect] = Array.from(root.querySelectorAll('select'));
    choose(productSelect as HTMLSelectElement, String(productId));
    await fixture.whenStable();
    choose(root.querySelector('.field--qty input') as HTMLInputElement, String(quantity), 'input');
    buttonByText(root, 'Adicionar').click();
    await fixture.whenStable();
  }

  async function selectCustomer(id: number): Promise<void> {
    choose(root.querySelector('select') as HTMLSelectElement, String(id));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    await render();
  });

  afterEach(() => http.verify());

  it('does not send an order without customer and products', async () => {
    buttonByText(root, 'Finalizar pedido').click();
    await fixture.whenStable();

    expect(root.textContent).toContain('Selecione o cliente do pedido.');
    expect(root.textContent).toContain('Adicione pelo menos um produto ao pedido.');
    http.expectNone({ method: 'POST' });
  });

  it('adds, merges and removes items while previewing the total', async () => {
    await add(burger.id, 2);
    await add(soda.id, 1);
    await add(burger.id, 1);

    expect(root.querySelectorAll('tbody tr').length).toBe(2);
    expect(root.querySelector('.receipt__total')?.textContent).toContain('82,00');

    buttonByText(root, 'Remover').click();
    await fixture.whenStable();

    expect(root.querySelectorAll('tbody tr').length).toBe(1);
    expect(root.querySelector('.receipt__total')?.textContent).toContain('7,00');
  });

  it('sends only ids and quantities and opens the created order', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await selectCustomer(1);
    await add(burger.id, 3);

    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    buttonByText(root, 'Finalizar pedido').click();

    const request = http.expectOne({ method: 'POST', url: '/api/v1/orders' });
    expect(request.request.body).toEqual({ customerId: 1, items: [{ productId: 1, quantity: 3 }] });
    request.flush({ data: anOrder({ id: 42 }) });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/orders', 42]);
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
  });

  it('shows the API message when a product was deactivated meanwhile', async () => {
    await selectCustomer(1);
    await add(burger.id, 1);
    buttonByText(root, 'Finalizar pedido').click();

    http
      .expectOne({ method: 'POST', url: '/api/v1/orders' })
      .flush(
        { error: { code: 'PRODUCT_INACTIVE', message: 'Produto(s) inativo(s): X-Burger.' } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    TestBed.tick();

    // The product list is reloaded so the deactivated one disappears.
    http.expectOne((request) => request.url === '/api/v1/products').flush(page([soda]));
    await fixture.whenStable();

    expect(root.querySelector('[role="alert"]')?.textContent).toContain('X-Burger');
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });
});
