import { Exception } from '@adonisjs/core/exceptions'

/**
 * Base class for business rule violations. The global exception handler
 * turns them into `{ error: { code, message, details } }` responses.
 */
export default class DomainException extends Exception {
  static status = 422

  constructor(
    message: string,
    code: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message, { code })
  }
}
