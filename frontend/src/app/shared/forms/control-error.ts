import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from '../../core/api/api-error';

/** First error of a touched control. `server` holds messages from a 422. */
export function controlError(control: AbstractControl): string | null {
  const errors = control.errors;
  if (!errors || !control.touched) return null;

  if (typeof errors['server'] === 'string') return errors['server'];
  if (errors['required']) return 'Campo obrigatório.';
  if (errors['minlength'])
    return `Use pelo menos ${errors['minlength'].requiredLength} caracteres.`;
  if (errors['maxlength']) return `Use no máximo ${errors['maxlength'].requiredLength} caracteres.`;
  if (errors['min']) return `O valor mínimo é ${errors['min'].min}.`;
  if (errors['max']) return `O valor máximo é ${errors['max'].max}.`;
  if (errors['pattern']) return 'Formato inválido.';
  return 'Valor inválido.';
}

/** Puts 422 field errors on the matching controls; `fieldToControl` renames fields. */
export function applyServerErrors(
  form: FormGroup,
  error: ApiError,
  fieldToControl: Record<string, string> = {},
): void {
  for (const { field, message } of error.fieldErrors) {
    const control = form.get(fieldToControl[field] ?? field);
    control?.setErrors({ server: message });
    control?.markAsTouched();
  }
}
