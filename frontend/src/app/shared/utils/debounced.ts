import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Follows `source` only after it stops changing for `ms` milliseconds.
 * Used by search boxes so the API is not called on every keystroke.
 * Must run in an injection context (e.g. a field initializer).
 */
export function debounced<T>(source: Signal<T>, ms = 300): Signal<T> {
  return toSignal(toObservable(source).pipe(debounceTime(ms), distinctUntilChanged()), {
    initialValue: source(),
  });
}
