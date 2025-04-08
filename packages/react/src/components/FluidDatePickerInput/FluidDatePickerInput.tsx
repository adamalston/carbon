/**
 * Copyright IBM Corp. 2022
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import DatePickerInput, { DatePickerInputProps } from '../DatePickerInput';
import { FormContext } from '../FluidForm/FormContext';

const FluidDatePickerInput = forwardRef<HTMLDivElement, DatePickerInputProps>(
  (props, ref) => {
    return (
      <FormContext.Provider value={{ isFluid: true }}>
        <DatePickerInput ref={ref} {...props} />
      </FormContext.Provider>
    );
  }
);

export default FluidDatePickerInput;
