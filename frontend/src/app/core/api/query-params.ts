import { HttpParams } from '@angular/common/http';

/**
 * Builds query params skipping empty values, so filters that are not set
 * are simply left out of the URL.
 */
export function toQueryParams(query: object): HttpParams {
  const entries: [string, unknown][] = Object.entries(query);
  let params = new HttpParams();

  for (const [key, value] of entries) {
    if (typeof value === 'string' && value.trim() === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
