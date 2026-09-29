import { Component, computed, input } from '@angular/core';

/** Warm tones from the app palette; the same name always gets the same one. */
const TONES = ['#c8412a', '#1d5f5a', '#8a5a00', '#2e6b1f', '#5b4a8a', '#3d3830'];

@Component({
  selector: 'app-avatar',
  template: `<span class="avatar" [style.--tone]="tone()" aria-hidden="true">{{
    initials()
  }}</span>`,
})
export class Avatar {
  readonly name = input.required<string>();

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
    return (first + last).toUpperCase();
  });

  protected readonly tone = computed(() => {
    let hash = 0;
    for (const char of this.name()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return TONES[hash % TONES.length];
  });
}
