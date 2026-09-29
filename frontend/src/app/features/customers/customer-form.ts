import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, errorMessage } from '../../core/api/api-error';
import { Customer } from '../../core/models/customer';
import { ToastService } from '../../core/notifications/toast.service';
import { CustomersService } from '../../core/services/customers.service';
import { applyServerErrors, controlError } from '../../shared/forms/control-error';

/** Same rule as the API: usual phone characters and 10 to 13 digits. */
const PHONE_PATTERN = /^\+?(?:[\s().-]*\d){10,13}[\s().-]*$/;

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="panel form" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 class="panel__title">{{ customer() ? 'Editar cliente' : 'Novo cliente' }}</h2>

      <div class="form__row">
        <label class="field field--grow">
          <span class="field__label">Nome</span>
          <input class="input" formControlName="name" autocomplete="off" maxlength="120" />
          @if (error('name'); as message) {
            <small class="field__error">{{ message }}</small>
          }
        </label>

        <label class="field">
          <span class="field__label">Telefone</span>
          <input
            class="input mono"
            type="tel"
            formControlName="phone"
            placeholder="(13) 99999-0000"
            inputmode="tel"
          />
          @if (error('phone'); as message) {
            <small class="field__error">{{ message }}</small>
          }
        </label>
      </div>

      @if (formError(); as message) {
        <p class="form__error" role="alert">{{ message }}</p>
      }

      <div class="form__actions">
        <button type="button" class="btn btn--ghost" (click)="canceled.emit()">Cancelar</button>
        <button type="submit" class="btn btn--primary" [disabled]="saving()">
          {{ saving() ? 'Salvando…' : 'Salvar cliente' }}
        </button>
      </div>
    </form>
  `,
})
export class CustomerForm {
  private readonly customers = inject(CustomersService);
  private readonly toasts = inject(ToastService);

  /** Customer being edited; `null` creates a new one. */
  readonly customer = input<Customer | null>(null);
  readonly saved = output<Customer>();
  readonly canceled = output<void>();

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  constructor() {
    effect(() => {
      const customer = this.customer();
      this.formError.set(null);
      this.form.reset({ name: customer?.name ?? '', phone: customer?.phone ?? '' });
    });
  }

  protected error(name: 'name' | 'phone'): string | null {
    const control = this.form.controls[name];
    if (name === 'phone' && control.hasError('pattern') && control.touched) {
      return 'Informe um telefone com DDD, ex.: (13) 99999-0000.';
    }
    return controlError(control);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, phone } = this.form.getRawValue();
    const input = { name: name.trim(), phone: phone.trim() };
    const customer = this.customer();
    const request = customer
      ? this.customers.update(customer.id, input)
      : this.customers.create(input);

    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toasts.success(customer ? 'Cliente atualizado.' : 'Cliente cadastrado.');
        this.saved.emit(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError && error.isValidation) {
          applyServerErrors(this.form, error);
        } else {
          this.formError.set(errorMessage(error));
        }
      },
    });
  }
}
