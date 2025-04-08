/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getAttributes } from '@carbon/icon-helpers';
import PropTypes from 'prop-types';
import React, { forwardRef, type ReactSVGElement, type SVGProps } from 'react';

export interface IconProps
  extends Omit<React.SVGProps<React.ReactSVGElement>, 'ref' | 'tabIndex'> {
  /**
   * @see React.SVGAttributes.tabIndex
   * @todo remove support for string in v12
   */
  tabIndex?: string | number | undefined;

  title?: string | undefined;
}

const Icon = forwardRef<ReactSVGElement, IconProps>((props, ref) => {
  const {
    className,
    children,
    tabIndex,
    xmlns = 'http://www.w3.org/2000/svg',
    preserveAspectRatio = 'xMidYMid meet',
    ...rest
  } = props;
  const { tabindex, ...attrs } = getAttributes({
    ...rest,
    tabindex: tabIndex,
  });
  const svgProps: SVGProps<ReactSVGElement> = attrs;

  if (className) {
    svgProps.className = className;
  }

  if (tabindex !== undefined && tabindex !== null) {
    if (typeof tabindex === 'number') {
      svgProps.tabIndex = tabindex;
    } else {
      svgProps.tabIndex = Number(tabIndex);
    }
  }

  if (ref) {
    svgProps.ref = ref;
  }

  if (xmlns) {
    svgProps.xmlns = xmlns;
  }

  if (preserveAspectRatio) {
    svgProps.preserveAspectRatio = preserveAspectRatio;
  }

  return React.createElement('svg', svgProps, children);
});

Icon.displayName = 'Icon';
Icon.propTypes = {
  'aria-hidden': PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOf<'true' | 'false'>(['true', 'false']),
  ]),
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  preserveAspectRatio: PropTypes.string,
  tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  viewBox: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  xmlns: PropTypes.string,
};

export default Icon;
