import app from '@adonisjs/core/services/app'
import { Exception } from '@adonisjs/core/exceptions'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'
import DomainException from '#exceptions/domain_exception'

type ErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Every error leaves the API with the same shape:
 * `{ error: { code, message, details? } }`. Stack traces are only logged.
 */
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const [status, body] = this.toResponse(error)
    return ctx.response.status(status).send(body)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  private toResponse(error: unknown): [number, ErrorBody] {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return [
        422,
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos.',
            details: error.messages,
          },
        },
      ]
    }

    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return [404, { error: { code: 'NOT_FOUND', message: 'Registro não encontrado.' } }]
    }

    if (error instanceof DomainException) {
      return [
        error.status,
        {
          error: {
            code: error.code ?? 'BUSINESS_RULE',
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        },
      ]
    }

    /**
     * Framework errors below 500 (unknown route, too large payload...) are
     * safe to expose.
     */
    if (error instanceof Exception && error.status < 500) {
      return [
        error.status,
        { error: { code: error.code ?? 'BAD_REQUEST', message: error.message } },
      ]
    }

    /**
     * The body parser flags malformed JSON by attaching a 400 status to the
     * native SyntaxError.
     */
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
      return [
        400,
        { error: { code: 'INVALID_JSON', message: 'O corpo da requisição não é um JSON válido.' } },
      ]
    }

    return [
      500,
      { error: { code: 'INTERNAL_ERROR', message: 'Erro inesperado. Tente novamente.' } },
    ]
  }
}
