import { Exception } from '@adonisjs/core/exceptions'

/** Business rule violation. The handler renders it as { error: { code, message, details } }. */
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
