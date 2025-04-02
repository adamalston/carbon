/**
 * Copyright IBM Corp. 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Validator } from 'prop-types';
import PropTypes from 'prop-types';
import type { ElementType } from 'react';

export const getTypedObjectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as Array<keyof T>;

export const elementTypeValidator: Validator<ElementType | null | undefined> = (
  props,
  propName,
  componentName,
  ...rest
) => PropTypes.elementType(props, propName, componentName, ...rest);
