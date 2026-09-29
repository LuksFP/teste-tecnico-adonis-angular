import { toQueryParams } from './query-params';

describe('toQueryParams', () => {
  it('keeps set filters and drops the empty ones', () => {
    const params = toQueryParams({
      page: 2,
      search: '  ',
      status: undefined,
      active: false,
      perPage: null,
    });

    expect(params.keys()).toEqual(['page', 'active']);
    expect(params.get('page')).toBe('2');
    expect(params.get('active')).toBe('false');
  });
});
