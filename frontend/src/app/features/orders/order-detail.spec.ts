import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiErrorInterceptor } from '../../core/api/api-error.interceptor';
import { Order } from '../../core/models/order';
import { anOrder, buttonByText } from '../../../testing/fixtures';
import { OrderDetail } from './order-detail';

describe('OrderDetail', () => {
  let fixture: ComponentFixture<OrderDetail>;
  let http: HttpTestingController;
  let root: HTMLElement;

  async function render(order: Order): Promise<void> {
    fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('id', order.id);
    root = fixture.nativeElement;
    TestBed.tick();
    http.expectOne(`/api/v1/orders/${order.id}`).flush({ data: order });
    await fixture.whenStable();
  }

  function buttonTexts(): string[] {
    return Array.from(root.querySelectorAll('.status-actions button')).map(
      (button) => button.textContent?.trim() ?? '',
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows the frozen item prices and the order total', async () => {
    await render(anOrder());

    const firstRow = root.querySelector('tbody tr')?.textContent ?? '';
    expect(firstRow).toContain('X-Burger');
    expect(firstRow).toContain('25,00');
    expect(root.querySelector('tfoot')?.textContent).toContain('50,00');
  });

  it('offers only the statuses the API allows next', async () => {
    await render(anOrder({ status: 'pending', nextStatuses: ['preparing', 'canceled'] }));

    expect(buttonTexts()).toEqual(['Iniciar preparo', 'Cancelar pedido']);
  });

  it('moves the order forward and shows the new status', async () => {
    await render(anOrder());

    buttonByText(root, 'Iniciar preparo').click();
    const request = http.expectOne({ method: 'PATCH', url: '/api/v1/orders/7/status' });
    expect(request.request.body).toEqual({ status: 'preparing', from: 'pending' });
    request.flush({ data: anOrder({ status: 'preparing', nextStatuses: ['ready', 'canceled'] }) });
    await fixture.whenStable();

    expect(root.querySelector('.page-header .badge')?.textContent).toContain('Em preparação');
    expect(buttonTexts()).toEqual(['Marcar como pronto', 'Cancelar pedido']);
  });

  it('asks before canceling and does nothing if the user gives up', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await render(anOrder());

    buttonByText(root, 'Cancelar pedido').click();

    expect(confirm).toHaveBeenCalled();
    http.expectNone({ method: 'PATCH' });
  });

  it('a canceled order has no actions and gets the stamp', async () => {
    await render(anOrder({ status: 'canceled', nextStatuses: [] }));

    expect(buttonTexts()).toEqual([]);
    expect(root.querySelector('.stamp')?.textContent).toContain('Cancelado');
    expect(root.textContent).toContain('O status não pode mais ser alterado');
  });

  it('reloads the order when someone else changed it first', async () => {
    await render(anOrder());

    buttonByText(root, 'Iniciar preparo').click();
    http
      .expectOne({ method: 'PATCH' })
      .flush(
        { error: { code: 'ORDER_STATUS_CHANGED', message: 'O pedido #7 mudou de status.' } },
        { status: 409, statusText: 'Conflict' },
      );
    TestBed.tick();
    http.expectOne({ method: 'GET', url: '/api/v1/orders/7' }).flush({
      data: anOrder({ status: 'canceled', nextStatuses: [] }),
    });
    await fixture.whenStable();

    expect(root.querySelector('.page-header .badge')?.textContent).toContain('Cancelado');
  });
});
