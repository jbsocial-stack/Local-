import { describe, expect, it } from 'vitest';
import { toCsv } from '../../src/lib/csv';

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    const csv = toCsv(['a', 'b'], [[1, 2], [3, 4]]);
    expect(csv).toBe('a,b\r\n1,2\r\n3,4');
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    const csv = toCsv(['name'], [['Smith, John'], ['Say "hi"'], ['line1\nline2']]);
    expect(csv).toBe('name\r\n"Smith, John"\r\n"Say ""hi"""\r\n"line1\nline2"');
  });

  it('renders null as an empty field', () => {
    const csv = toCsv(['x'], [[null]]);
    expect(csv).toBe('x\r\n');
  });
});
