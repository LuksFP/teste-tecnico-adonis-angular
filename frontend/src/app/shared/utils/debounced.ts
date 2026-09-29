import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/** `source`, updated only after it stops changing for `ms`. Call it in an injection context. */
export function debounced<T>(source: Signal<T>, ms = 300): Signal<T> {
  return toSignal(toObservable(source).pipe(debounceTime(ms), distinctUntilChanged()), {
    initialValue: source(),
  });
}
