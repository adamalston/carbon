/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import React, {
  cloneElement,
  useContext,
  useState,
  type ChangeEventHandler,
  type ComponentPropsWithRef,
  type ForwardedRef,
  type ReactNode,
} from 'react';
import classNames from 'classnames';
import {
  ChevronDown,
  WarningFilled,
  WarningAltFilled,
} from '@carbon/icons-react';
import { deprecate } from '../../prop-types/deprecate';
import { usePrefix } from '../../internal/usePrefix';
import { FormContext } from '../FluidForm';
import { useId } from '../../internal/useId';
import { composeEventHandlers } from '../../tools/events';
import { Text } from '../Text';
import { AILabel } from '../AILabel';
import { isComponentElement } from '../../internal';

type ExcludedAttributes = 'size';

export interface SelectProps
  extends Omit<ComponentPropsWithRef<'select'>, ExcludedAttributes> {
  /**
   * Provide the contents of your Select
   */
  children?: ReactNode;

  /**
   * Specify an optional className to be applied to the node containing the label and the select box
   */
  className?: string;

  /**
   * **Experimental**: Provide a `decorator` component to be rendered inside the `Select` component
   */
  decorator?: ReactNode;

  /**
   * Optionally provide the default value of the `<select>`
   */
  defaultValue?: any;

  /**
   * Specify whether the control is disabled
   */
  disabled?: boolean;

  /**
   * Provide text that is used alongside the control label for additional help
   */
  helperText?: ReactNode;

  /**
   * Specify whether the label should be hidden, or not
   */
  hideLabel?: boolean;

  /**
   * Specify a custom `id` for the `<select>`
   */
  id: string;

  /**
   * Specify whether you want the inline version of this control
   */
  inline?: boolean;

  /**
   * Specify if the currently value is invalid.
   */
  invalid?: boolean;

  /**
   * Message which is displayed if the value is invalid.
   */
  invalidText?: ReactNode;

  /**
   * Provide label text to be read by screen readers when interacting with the control.
   */
  labelText?: ReactNode;

  /**
   * `true` to use the light version. For use on $ui-01 backgrounds only.
   * Don't use this to make tile background color same as container background color.
   *
   * @deprecated The `light` prop for `Select` is no longer needed and has been deprecated in v11 in favor of the new `Layer` component.
   * It will be moved in the next major release.
   */
  light?: boolean;

  /**
   * Reserved for use with Pagination component. Will not render a label for the
   * select since Pagination renders one for us.
   */
  noLabel?: boolean;

  /**
   * Provide an optional `onChange` hook that is called each time the value of the underlying `<input>` changes.
   */
  onChange?: ChangeEventHandler<HTMLSelectElement>;

  /**
   * Whether the select should be read-only
   */
  readOnly?: boolean;

  /**
   * Specify the size of the Select Input.
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * @deprecated please use decorator instead.
   * **Experimental**: Provide a `Slug` component to be rendered inside the `Dropdown` component
   */
  slug?: ReactNode;

  /**
   * Specify whether the control is currently in warning state
   */
  warn?: boolean;

  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText?: ReactNode;
}

const Select = React.forwardRef(function Select(
  {
    className,
    decorator,
    id,
    inline = false,
    labelText = 'Select',
    disabled = false,
    children,
    // reserved for use with Pagination component
    noLabel = false,
    // eslint-disable-next-line no-unused-vars
    hideLabel = false,
    invalid = false,
    invalidText = '',
    helperText = '',
    light = false,
    readOnly,
    size,
    warn = false,
    warnText,
    onChange,
    slug,
    ...other
  }: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>
) {
  const prefix = usePrefix();
  const { isFluid } = useContext(FormContext);
  const [isFocused, setIsFocused] = useState(false);
  const selectInstanceId = useId();

  interface SelectItemProps {
    value: any;
    text: string;
  }
  // Convert children to an array of valid elements once using type narrowing
  const validChildren = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<SelectItemProps> =>
      React.isValidElement<SelectItemProps>(child)
  );

  // Find the default option based on the specified defaultValue
  const defaultOption = validChildren.find(
    (child) => child.props?.value === other?.defaultValue
  );

  // Use the default option's text if available; otherwise, fallback to the first option's text
  const initialTitle =
    defaultOption?.props?.text || validChildren[0]?.props?.text || '';

  const [title, setTitle] = useState(initialTitle);
  const selectClasses = classNames({
    [`${prefix}--select`]: true,
    [`${prefix}--select--inline`]: inline,
    [`${prefix}--select--light`]: light,
    [`${prefix}--select--invalid`]: invalid,
    [`${prefix}--select--disabled`]: disabled,
    [`${prefix}--select--readonly`]: readOnly,
    [`${prefix}--select--warning`]: warn,
    [`${prefix}--select--fluid--invalid`]: isFluid && invalid,
    [`${prefix}--select--fluid--focus`]: isFluid && isFocused,
    [`${prefix}--select--slug`]: slug,
    [`${prefix}--select--decorator`]: decorator,
  });
  const labelClasses = classNames(`${prefix}--label`, {
    [`${prefix}--visually-hidden`]: hideLabel,
    [`${prefix}--label--disabled`]: disabled,
  });
  const inputClasses = classNames({
    [`${prefix}--select-input`]: true,
    [`${prefix}--select-input--${size}`]: size,
  });
  const errorId = `${id}-error-msg`;
  const errorText = (() => {
    if (invalid) {
      return invalidText;
    }
    if (warn) {
      return warnText;
    }
  })();
  const error =
    invalid || warn ? (
      <Text as="div" className={`${prefix}--form-requirement`} id={errorId}>
        {errorText}
      </Text>
    ) : null;
  const helperTextClasses = classNames(`${prefix}--form__helper-text`, {
    [`${prefix}--form__helper-text--disabled`]: disabled,
  });

  const helperId = !helperText
    ? undefined
    : `select-helper-text-${selectInstanceId}`;

  const helper = helperText ? (
    <Text as="div" id={helperId} className={helperTextClasses}>
      {helperText}
    </Text>
  ) : null;
  const ariaProps = {};
  if (invalid) {
    ariaProps['aria-describedby'] = errorId;
  } else if (!inline && !isFluid) {
    ariaProps['aria-describedby'] = helper ? helperId : undefined;
  }

  const handleFocus = (evt) => {
    setIsFocused(evt.type === 'focus' ? true : false);
  };

  const handleChange = (evt) => {
    const selectedOption = evt?.target?.options[evt.target.selectedIndex];
    setTitle(selectedOption?.text);
  };

  const readOnlyEventHandlers = {
    onMouseDown: (evt) => {
      // NOTE: does not prevent click
      if (readOnly) {
        evt.preventDefault();
        // focus on the element as per readonly input behavior
        evt.target.focus();
      }
    },
    onKeyDown: (evt) => {
      const selectAccessKeys = ['ArrowDown', 'ArrowUp', ' '];
      // This prevents the select from opening for the above keys
      if (readOnly && selectAccessKeys.includes(evt.key)) {
        evt.preventDefault();
      }
    },
  };

  // AILabel always size `mini`
  const candidate = slug ?? decorator;
  const candidateIsAILabel = isComponentElement(candidate, AILabel);
  const normalizedDecorator = candidateIsAILabel
    ? cloneElement(candidate, { size: 'mini' })
    : null;

  const input = (() => {
    return (
      <>
        <select
          {...other}
          {...ariaProps}
          id={id}
          className={inputClasses}
          disabled={disabled || undefined}
          aria-invalid={invalid || undefined}
          aria-readonly={readOnly || undefined}
          title={title}
          onChange={composeEventHandlers([onChange, handleChange])}
          {...readOnlyEventHandlers}
          ref={ref}>
          {children}
        </select>
        <ChevronDown className={`${prefix}--select__arrow`} />
        {invalid && (
          <WarningFilled className={`${prefix}--select__invalid-icon`} />
        )}
        {!invalid && warn && (
          <WarningAltFilled
            className={`${prefix}--select__invalid-icon ${prefix}--select__invalid-icon--warning`}
          />
        )}
      </>
    );
  })();
  return (
    <div className={classNames(`${prefix}--form-item`, className)}>
      <div className={selectClasses}>
        {!noLabel && (
          <Text as="label" htmlFor={id} className={labelClasses}>
            {labelText}
          </Text>
        )}
        {inline && (
          <div className={`${prefix}--select-input--inline__wrapper`}>
            <div
              className={`${prefix}--select-input__wrapper`}
              data-invalid={invalid || null}>
              {input}
            </div>
            {error}
          </div>
        )}
        {!inline && (
          <div
            className={`${prefix}--select-input__wrapper`}
            data-invalid={invalid || null}
            onFocus={handleFocus}
            onBlur={handleFocus}>
            {input}
            {slug ? (
              normalizedDecorator
            ) : decorator ? (
              <div className={`${prefix}--select__inner-wrapper--decorator`}>
                {normalizedDecorator}
              </div>
            ) : (
              ''
            )}
            {isFluid && <hr className={`${prefix}--select__divider`} />}
            {isFluid && error ? error : null}
          </div>
        )}
        {!inline && !isFluid && error ? error : helper}
      </div>
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  /**
   * Provide the contents of your Select
   */
  children: PropTypes.node,

  /**
   * Specify an optional className to be applied to the node containing the label and the select box
   */
  className: PropTypes.string,

  /**
   * **Experimental**: Provide a decorator component to be rendered inside the `Select` component
   */
  decorator: PropTypes.node,

  /**
   * Optionally provide the default value of the `<select>`
   */
  defaultValue: PropTypes.any,

  /**
   * Specify whether the control is disabled
   */
  disabled: PropTypes.bool,

  /**
   * Provide text that is used alongside the control label for additional help
   */
  helperText: PropTypes.node,

  /**
   * Specify whether the label should be hidden, or not
   */
  hideLabel: PropTypes.bool,

  /**
   * Specify a custom `id` for the `<select>`
   */
  id: PropTypes.string.isRequired,

  /**
   * Specify whether you want the inline version of this control
   */
  inline: PropTypes.bool,

  /**
   * Specify if the currently value is invalid.
   */
  invalid: PropTypes.bool,

  /**
   * Message which is displayed if the value is invalid.
   */
  invalidText: PropTypes.node,

  /**
   * Provide label text to be read by screen readers when interacting with the
   * control
   */
  labelText: PropTypes.node,

  /**
   * `true` to use the light version. For use on $ui-01 backgrounds only.
   * Don't use this to make tile background color same as container background color.
   */
  light: deprecate(
    PropTypes.bool,
    'The `light` prop for `Select` is no longer needed and has ' +
      'been deprecated in v11 in favor of the new `Layer` component. It will be moved in the next major release.'
  ),

  /**
   * Reserved for use with Pagination component. Will not render a label for the
   * select since Pagination renders one for us.
   */
  noLabel: PropTypes.bool,

  /**
   * Provide an optional `onChange` hook that is called each time the value of
   * the underlying `<input>` changes
   */
  onChange: PropTypes.func,

  /**
   * Whether the select should be read-only
   */
  readOnly: PropTypes.bool,

  /**
   * Specify the size of the Select Input.
   */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  slug: deprecate(
    PropTypes.node,
    'The `slug` prop has been deprecated and will be removed in the next major version. Use the decorator prop instead.'
  ),
  /**
   * Specify whether the control is currently in warning state
   */
  warn: PropTypes.bool,

  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText: PropTypes.node,
};

export default Select;
