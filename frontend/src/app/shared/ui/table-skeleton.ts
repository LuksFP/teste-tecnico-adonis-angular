import { Component, input } from '@angular/core';

/** Loading placeholder with the table's shape, so the page doesn't jump. */
@Component({
  selector: 'app-table-skeleton',
  template: `
    <div class="skeleton" role="status" [attr.aria-label]="label()">
      @for (row of rows; track row) {
        <div class="skeleton__row">
          <span class="skeleton__bar skeleton__bar--short"></span>
          <span class="skeleton__bar"></span>
          <span class="skeleton__bar skeleton__bar--mid"></span>
        </div>
      }
    </div>
  `,
})
export class TableSkeleton {
  /** Read by screen readers, e.g. "Carregando pedidos". */
  readonly label = input.required<string>();
  protected readonly rows = [1, 2, 3, 4, 5];
}
