import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiError, errorMessage } from '../../core/api/api-error';
import { Product } from '../../core/models/product';
import { ProductsService } from '../../core/services/products.service';
import { ToastService } from '../../core/notifications/toast.service';
import { applyServerErrors, controlError } from '../../shared/forms/control-error';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="panel form" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2 class="panel__title">{{ product() ? 'Editar produto' : 'Novo produto' }}</h2>

      <div class="form__row">
        <label class="field field--grow">
          <span class="field__label">Nome</span>
          <input class="input" formControlName="name" autocomplete="off" maxlength="120" />
          @if (error('name'); as message) {
            <small class="field__error">{{ message }}</small>
          }
        </label>

        <label class="field field--price">
          <span class="field__label">Preço (R$)</span>
          <input
            class="input mono"
            type="number"
            formControlName="price"
            min="0.01"
            step="0.01"
            inputmode="decimal"
          />
          @if (error('price'); as message) {
            <small class="field__error">{{ message }}</small>
          }
        </label>

        <label class="check">
          <input type="checkbox" formControlName="active" />
          <span>Disponível para venda</span>
        </label>
      </div>

      @if (formError(); as message) {
        <p class="form__error" role="alert">{{ message }}</p>
      }

      <div class="form__actions">
        <button type="button" class="btn btn--ghost" (click)="canceled.emit()">Cancelar</button>
        <button type="submit" class="btn btn--primary" [disabled]="saving()">
          {{ saving() ? 'Salvando…' : 'Salvar produto' }}
        </button>
      </div>
    </form>
  `,
})
export class ProductForm {
  private readonly products = inject(ProductsService);
  private readonly toasts = inject(ToastService);

  /** Product being edited; `null` creates a new one. */
  readonly product = input<Product | null>(null);
  readonly saved = output<Product>();
  readonly canceled = output<void>();

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    /** Typed in reais; sent to the API in cents. */
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    active: [true],
  });

  private readonly isEditing = computed(() => this.product() !== null);

  constructor() {
    effect(() => {
      const product = this.product();
      this.formError.set(null);
      this.form.reset({
        name: product?.name ?? '',
        price: product ? product.priceCents / 100 : null,
        active: product?.active ?? true,
      });
    });
  }

  protected error(name: 'name' | 'price'): string | null {
    return controlError(this.form.controls[name]);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    const { name, price, active } = this.form.getRawValue();
    if (this.form.invalid || price === null) return;

    const input = { name: name.trim(), priceCents: Math.round(price * 100), active };
    const product = this.product();
    const request = product ? this.products.update(product.id, input) : this.products.create(input);

    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toasts.success(this.isEditing() ? 'Produto atualizado.' : 'Produto cadastrado.');
        this.saved.emit(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError && error.isValidation) {
          applyServerErrors(this.form, error, { priceCents: 'price' });
        } else {
          this.formError.set(errorMessage(error));
        }
      },
    });
  }
}
