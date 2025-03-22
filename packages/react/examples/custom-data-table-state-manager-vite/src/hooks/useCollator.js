/**
 * Copyright IBM Corp. 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useCallback } from 'react';

/**
 * @param {Intl.Collator} collator The ECMA402 collator.
 * @returns {(a: any, b: any) => boolean} The comparator.
 */
const useCollator = (collator) =>
  useCallback(
    (lhs, rhs) => {
      if (typeof lhs === 'number' && typeof rhs === 'number') {
        return lhs - rhs;
      }
      return collator.compare(lhs, rhs);
    },
    [collator]
  );

export default useCollator;
