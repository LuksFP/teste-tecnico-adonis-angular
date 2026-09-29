import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('formats cents as reais', () => {
    expect(pipe.transform(2500).replace(/\s/g, ' ')).toBe('R$ 25,00');
    expect(pipe.transform(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
  });

  it('shows a dash when there is no value', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});
