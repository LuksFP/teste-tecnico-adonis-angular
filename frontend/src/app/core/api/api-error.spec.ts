import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';

describe('ApiError', () => {
  it('reads code, message and field errors from the API body', () => {
    const response = new HttpErrorResponse({
      status: 422,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          details: [{ field: 'name', message: 'Campo obrigatório.', rule: 'required' }],
        },
      },
    });

    const error = ApiError.from(response);

    expect(error.status).toBe(422);
    expect(error.isValidation).toBe(true);
    expect(error.messageFor('name')).toBe('Campo obrigatório.');
  });

  it('keeps the message of business errors', () => {
    const error = ApiError.from(
      new HttpErrorResponse({
        status: 409,
        error: { error: { code: 'INVALID_STATUS_TRANSITION', message: 'Não é possível.' } },
      }),
    );

    expect(error.code).toBe('INVALID_STATUS_TRANSITION');
    expect(error.message).toBe('Não é possível.');
    expect(error.fieldErrors).toEqual([]);
  });

  it('explains when the API cannot be reached', () => {
    const error = ApiError.from(new HttpErrorResponse({ status: 0 }));

    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('falls back to a generic message for unexpected bodies', () => {
    const error = ApiError.from(new HttpErrorResponse({ status: 500, error: '<html>' }));

    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toContain('Algo deu errado');
  });
});
