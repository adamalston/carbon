/**
 * Copyright IBM Corp. 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { defaultFilterRows } from '../filter';

describe('defaultFilterRows', () => {
  const getCellId = (rowId, key) => `${rowId}-${key}`;

  const headers = [{ key: 'name' }, { key: 'age' }, { key: 'active' }];
  const cellsById = {
    '1-name': { value: 'Alice' },
    '1-age': { value: 30 },
    '1-active': { value: true },
    '2-name': { value: 'Bob' },
    '2-age': { value: 40 },
    '2-active': { value: false },
    '3-name': { value: 'Charlie' },
    '3-age': { value: 25 },
    '3-active': { value: true },
  };
  const rowIds = ['1', '2', '3'];

  it('should filter rows by name', () => {
    const result = defaultFilterRows({
      rowIds,
      headers,
      cellsById,
      inputValue: 'ali',
      getCellId,
    });

    expect(result).toEqual(['1']);
  });

  it('should filter rows by number (coerced to string)', () => {
    const result = defaultFilterRows({
      rowIds,
      headers,
      cellsById,
      inputValue: '40',
      getCellId,
    });

    expect(result).toEqual(['2']);
  });

  it('should ignore boolean fields', () => {
    const result = defaultFilterRows({
      rowIds,
      headers,
      cellsById,
      inputValue: 'true',
      getCellId,
    });

    expect(result).toEqual([]);
  });

  it('should perform a case-insensitive search', () => {
    const result = defaultFilterRows({
      rowIds,
      headers,
      cellsById,
      inputValue: 'CHARLIE',
      getCellId,
    });

    expect(result).toEqual(['3']);
  });

  it('should return an empty array when nothing matches', () => {
    const result = defaultFilterRows({
      rowIds,
      headers,
      cellsById,
      inputValue: 'xyz',
      getCellId,
    });

    expect(result).toEqual([]);
  });

  it('should handle an empty `rowIds` array', () => {
    const result = defaultFilterRows({
      rowIds: [],
      headers,
      cellsById,
      inputValue: 'alice',
      getCellId,
    });

    expect(result).toEqual([]);
  });

  it('should handle a missing cell gracefully', () => {
    const incompleteCellsById = { '1-name': { value: 'Alice' } };

    const result = defaultFilterRows({
      rowIds: ['1'],
      headers,
      cellsById: incompleteCellsById,
      inputValue: 'alice',
      getCellId,
    });

    expect(result).toEqual(['1']);
  });
});
