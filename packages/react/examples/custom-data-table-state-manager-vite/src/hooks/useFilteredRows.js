/**
 * Copyright IBM Corp. 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import doesRowMatchSearchString from '../misc/doesRowMatchSearchString';

/**
 * @param {object[]} rows The table rows.
 * @returns {Array} The memorized version of filtered rows, search string and the setter for the search string.
 */
const useFilteredRows = (rows) => {
  const [searchString, setSearchString] = useState('');
  const [debouncedSearchString] = useDebounce(searchString, 500);
  const filteredRows = useMemo(
    () =>
      !debouncedSearchString
        ? rows
        : rows.filter((row) =>
            doesRowMatchSearchString(row, debouncedSearchString)
          ),
    [debouncedSearchString, rows]
  );
  return [filteredRows, searchString, setSearchString];
};

export default useFilteredRows;
