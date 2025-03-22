/**
 * Copyright IBM Corp. 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @param row A table row.
 * @param searchString A search string.
 * @returns `true` if the given table row matches the given search string.
 */
const doesRowMatchSearchString = (row, searchString) =>
  Object.keys(row).some(
    (key) => key !== 'id' && String(row[key] ?? '').indexOf(searchString) >= 0
  );

export default doesRowMatchSearchString;
