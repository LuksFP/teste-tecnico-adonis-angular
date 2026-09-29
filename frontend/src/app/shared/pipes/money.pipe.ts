import { Pipe, PipeTransform } from '@angular/core';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formats an amount in cents as Brazilian reais: 2500 → "R$ 25,00".
 */
export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    return cents === null || cents === undefined ? '—' : formatCents(cents);
  }
}
