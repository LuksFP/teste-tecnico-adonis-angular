import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFieldErrors(details: unknown): FieldError[] {
  if (!Array.isArray(details)) return [];
  return details.flatMap((detail: unknown) =>
    isRecord(detail) && typeof detail['field'] === 'string' && typeof detail['message'] === 'string'
      ? [{ field: detail['field'], message: detail['message'] }]
      : [],
  );
}

/** Error thrown by every API call, read from { error: { code, message, details } }. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(response: HttpErrorResponse): ApiError {
    if (response.status === 0) {
      return new ApiError(
        0,
        'NETWORK_ERROR',
        'O servidor não respondeu. Tente de novo em instantes.',
      );
    }

    const body: unknown = response.error;
    const error = isRecord(body) && isRecord(body['error']) ? body['error'] : null;
    const code = typeof error?.['code'] === 'string' ? error['code'] : 'UNKNOWN_ERROR';
    const message =
      typeof error?.['message'] === 'string'
        ? error['message']
        : 'Não foi possível concluir. Tente de novo.';

    return new ApiError(response.status, code, message, toFieldErrors(error?.['details']));
  }

  get isValidation(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  messageFor(field: string): string | undefined {
    return this.fieldErrors.find((error) => error.field === field)?.message;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente de novo.';
}
