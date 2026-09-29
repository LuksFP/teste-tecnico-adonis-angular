import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../notifications/toast.service';
import { ApiError } from './api-error';

/**
 * Turns every HTTP failure into an `ApiError`. Connection problems and
 * server errors get a toast here; validation and business errors are left
 * for the screen that made the request, since it knows where to show them.
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
