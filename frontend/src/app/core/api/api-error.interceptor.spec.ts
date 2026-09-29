import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '../notifications/toast.service';
import { apiErrorInterceptor } from './api-error.interceptor';
import { ApiError } from './api-error';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => backend.verify());

  function request(): Promise<unknown> {
    return new Promise((resolve) => http.get('/api/v1/orders').subscribe({ error: resolve }));
  }

  it('turns HTTP failures into ApiError and leaves validation errors to the screen', async () => {
    const result = request();
    backend
      .expectOne('/api/v1/orders')
      .flush(
        { error: { code: 'VALIDATION_ERROR', message: 'Inválido' } },
        { status: 422, statusText: 'Unprocessable' },
      );

    const error = await result;
    expect(error).toBeInstanceOf(ApiError);
    expect(toasts.toasts()).toEqual([]);
  });

  it('shows a toast for server errors', async () => {
    const result = request();
    backend
      .expectOne('/api/v1/orders')
      .flush(
        { error: { code: 'INTERNAL_ERROR', message: 'Erro inesperado.' } },
        { status: 500, statusText: 'Error' },
      );

    await result;
    expect(toasts.toasts().map((toast) => toast.message)).toEqual(['Erro inesperado.']);
  });
});
