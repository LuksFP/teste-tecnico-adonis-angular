import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import { aProduct, buttonByText, choose } from '../../../testing/fixtures';
import { ProductForm } from './product-form';

describe('ProductForm', () => {
  let fixture: ComponentFixture<ProductForm>;
  let http: HttpTestingController;
  let root: HTMLElement;

  function field(name: string): HTMLInputElement {
    const input = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`);
    if (!input) throw new Error(`Field ${name} not found`);
    return input;
  }

  async function fill(name: string, price: string): Promise<void> {
    choose(field('name'), name, 'input');
    choose(field('price'), price, 'input');
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProductForm);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('sends the price typed in reais as cents', async () => {
    await fill('Suco natural', '9.9');

    buttonByText(root, 'Salvar produto').click();

    const request = http.expectOne({ method: 'POST', url: '/api/v1/products' });
    expect(request.request.body).toEqual({ name: 'Suco natural', priceCents: 990, active: true });
    request.flush({ data: aProduct() });
  });

  it('blocks an empty form without calling the API', async () => {
    buttonByText(root, 'Salvar produto').click();
    await fixture.whenStable();

    expect(root.querySelectorAll('.field__error').length).toBe(2);
    http.expectNone({ method: 'POST' });
  });

  it('shows API validation errors under the right field', async () => {
    await fill('Suco natural', '9.9');
    buttonByText(root, 'Salvar produto').click();

    http.expectOne({ method: 'POST' }).flush(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          details: [
            { field: 'priceCents', message: 'O campo preço deve estar entre 1 e 100000000.' },
          ],
        },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await fixture.whenStable();

    const priceError = field('price').closest('label')?.querySelector('.field__error');
    expect(priceError?.textContent).toContain('preço');
  });

  it('edits an existing product with PATCH', async () => {
    fixture.componentRef.setInput(
      'product',
      aProduct({ id: 3, name: 'X-Burger', priceCents: 2500 }),
    );
    await fixture.whenStable();
    expect(field('price').value).toBe('25');

    choose(field('price'), '27.5', 'input');
    buttonByText(root, 'Salvar produto').click();

    const request = http.expectOne({ method: 'PATCH', url: '/api/v1/products/3' });
    expect(request.request.body).toEqual({ name: 'X-Burger', priceCents: 2750, active: true });
    request.flush({ data: aProduct({ id: 3, priceCents: 2750 }) });
  });
});
