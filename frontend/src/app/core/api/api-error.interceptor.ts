import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../notifications/toast.service';
import { ApiError } from './api-error';

/**
 * Every HTTP failure becomes an ApiError. Network and 5xx errors show a toast;
 * validation and business errors are left to the screen that sent the request.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const apiError = ApiError.from(error);
      if (apiError.status === 0 || apiError.status >= 500) {
        toasts.error(apiError.message);
      }
      return throwError(() => apiError);
    }),
  );
};
