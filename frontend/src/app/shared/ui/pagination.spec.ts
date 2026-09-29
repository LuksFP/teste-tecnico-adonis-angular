import { ComponentFixture, TestBed } from '@angular/core/testing';
import { buttonByText } from '../../../testing/fixtures';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let root: HTMLElement;

  async function render(currentPage: number, lastPage: number, total: number): Promise<void> {
    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('meta', { total, perPage: 10, currentPage, lastPage });
    root = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('shows the range being displayed', async () => {
    await render(2, 3, 25);

    expect(root.textContent).toContain('11–20 de 25');
  });

  it('disables the edges and emits the page to go to', async () => {
    await render(1, 3, 25);
    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));

    expect(buttonByText(root, 'Anterior').disabled).toBe(true);
    buttonByText(root, 'Próxima').click();

    expect(pages).toEqual([2]);
  });

  it('hides the controls when everything fits in one page', async () => {
    await render(1, 1, 4);

    expect(root.querySelectorAll('button').length).toBe(0);
    expect(root.textContent).toContain('1–4 de 4');
  });
});
