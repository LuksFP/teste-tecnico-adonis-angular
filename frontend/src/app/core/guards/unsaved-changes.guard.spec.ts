import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function run(component: HasUnsavedChanges): unknown {
    return TestBed.runInInjectionContext(() => unsavedChangesGuard(component, route, state, state));
  }

  afterEach(() => vi.restoreAllMocks());

  it('lets the user leave when nothing is pending', () => {
    const confirm = vi.spyOn(window, 'confirm');

    expect(run({ hasUnsavedChanges: () => false })).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before discarding an unsaved order', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(run({ hasUnsavedChanges: () => true })).toBe(false);
  });
});
