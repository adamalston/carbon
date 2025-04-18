/**
 * Copyright IBM Corp. 2022
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import classnames from 'classnames';
import DatePicker from '../DatePicker';
import { usePrefix } from '../../internal/usePrefix';
import { FormContext } from '../FluidForm/FormContext';
import React from 'react';

export interface FluidDatePickerProps {
  /**
   * The child node(s)
   */
  children?: React.ReactNode;
  /**
   * Specify an optional className to be applied to the outer FluidForm wrapper
   */
  className?: string;
  /**
   * Specify whether or not the control is invalid
   */
  invalid?: boolean;
  /**
   * Provide the text that is displayed when the control is in error state
   */
  invalidText?: React.ReactNode;
  /**
   * Whether the input should be read-only
   */
  readOnly?: boolean;
  /**
   * Specify whether the control is currently in warning state
   */
  warn?: boolean;
  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText?: React.ReactNode;
}

const FluidDatePicker: React.FC<FluidDatePickerProps> = React.forwardRef<
  HTMLInputElement,
  FluidDatePickerProps
>(function FluidDatePicker(
  {
    className,
    children,
    invalid,
    invalidText,
    readOnly,
    warn,
    warnText,
    ...other
  },
  ref
) {
  const prefix = usePrefix();
  const classNames = classnames(className, {
    [`${prefix}--date-picker--fluid`]: true,
    [`${prefix}--date-picker--fluid--invalid`]: invalid,
    [`${prefix}--date-picker--fluid--readonly`]: readOnly,
    [`${prefix}--date-picker--fluid--warn`]: warn,
  });

  return (
    <FormContext.Provider value={{ isFluid: true }}>
      <DatePicker
        invalid={invalid}
        invalidText={invalidText}
        readOnly={readOnly}
        warn={warn}
        warnText={warnText}
        className={classNames}
        ref={ref}
        {...other}>
        {children}
      </DatePicker>
    </FormContext.Provider>
  );
});

FluidDatePicker.propTypes = {
  /**
   * The child node(s)
   */
  children: PropTypes.node,

  /**
   * Specify an optional className to be applied to the outer FluidForm wrapper
   */
  className: PropTypes.string,

  /**
   * Specify whether or not the control is invalid
   */
  invalid: PropTypes.bool,

  /**
   * Provide the text that is displayed when the control is in error state
   */
  invalidText: PropTypes.node,

  /**
   * Whether the input should be read-only
   */
  readOnly: PropTypes.bool,

  /**
   * Specify whether the control is currently in warning state
   */
  warn: PropTypes.bool,

  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText: PropTypes.node,
};

export default FluidDatePicker;
