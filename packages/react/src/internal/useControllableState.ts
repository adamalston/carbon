/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useRef, useState } from 'react';
import { warning } from './warning';

/**
 * This custom hook simplifies the behavior of a component that has state which
 * can be both controlled and uncontrolled. It behaves like a useState() hook
 * and provides [state, setState]. The optional `onChange` callback is used to
 * communicate changes to owners of controlled components.
 *
 * Note: The hook warns if the component switches between controlled and
 * uncontrolled states.
 */
export const useControllableState = <T>({
  defaultValue,
  name = 'custom',
  onChange,
  value,
}: {
  defaultValue: T;
  name?: string;
  onChange?: (value: T) => void;
  value?: T;
}): [T, (stateOrUpdater: T | ((prev: T) => T)) => void] => {
  const [state, internalSetState] = useState<T>(
    typeof value !== 'undefined' ? value : defaultValue
  );
  const controlled = useRef<boolean | null>(null);

  if (controlled.current === null) {
    controlled.current = value !== undefined;
  }

  const setState = (stateOrUpdater: T | ((prev: T) => T)) => {
    const newValue =
      typeof stateOrUpdater === 'function'
        ? (stateOrUpdater as (prev: T) => T)(state)
        : stateOrUpdater;

    if (controlled.current === false) {
      internalSetState(newValue);
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    const controlledValue = typeof value !== 'undefined';

    // Uncontrolled -> Controlled
    if (controlled.current === false && controlledValue) {
      warning(
        false,
        'A component is changing an uncontrolled %s component to be controlled. ' +
          'This is likely caused by the value changing to a defined value ' +
          'from undefined. Decide between using a controlled or uncontrolled ' +
          'value for the lifetime of the component. ' +
          'More info: https://reactjs.org/link/controlled-components',
        name
      );
    }

    // Controlled -> Uncontrolled
    if (controlled.current === true && !controlledValue) {
      warning(
        false,
        'A component is changing a controlled %s component to be uncontrolled. ' +
          'This is likely caused by the value changing to an undefined value ' +
          'from a defined one. Decide between using a controlled or ' +
          'uncontrolled value for the lifetime of the component. ' +
          'More info: https://reactjs.org/link/controlled-components',
        name
      );
    }
  }, [name, value]);

  if (controlled.current === true) {
    return [value as T, setState];
  }

  return [state, setState];
};
