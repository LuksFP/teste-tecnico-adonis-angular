import { Component, computed, input, output } from '@angular/core';
import { PageMeta } from '../../core/models/pagination';

@Component({
  selector: 'app-pagination',
  template: `
    @let page = meta();
    <nav class="pagination" aria-label="Paginação">
      <span class="pagination__range">{{ range() }}</span>
      @if (page.lastPage > 1) {
        <div class="pagination__controls">
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="page.currentPage <= 1"
            (click)="pageChange.emit(page.currentPage - 1)"
          >
            Anterior
          </button>
          <span class="mono">{{ page.currentPage }} / {{ page.lastPage }}</span>
          <button
            type="button"
            class="btn btn--ghost"
            [disabled]="page.currentPage >= page.lastPage"
            (click)="pageChange.emit(page.currentPage + 1)"
          >
            Próxima
          </button>
        </div>
      }
    </nav>
  `,
})
export class Pagination {
  readonly meta = input.required<PageMeta>();
  readonly pageChange = output<number>();

  protected readonly range = computed(() => {
    const { total, perPage, currentPage } = this.meta();
    if (total === 0) return 'Nenhum registro';
    const first = (currentPage - 1) * perPage + 1;
    const last = Math.min(currentPage * perPage, total);
    return `${first}–${last} de ${total}`;
  });
}
