/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { usePrefix } from '../../internal/usePrefix';

export interface SkeletonIconProps {
  /**
   * Specify an optional className to add.
   */
  className?: string;
}

const SkeletonIcon: React.FC<SkeletonIconProps> = ({ className, ...other }) => {
  const prefix = usePrefix();

  const skeletonIconClasses = classNames(className, {
    [`${prefix}--icon--skeleton`]: true,
  });

  return <div className={skeletonIconClasses} {...other} />;
};

SkeletonIcon.propTypes = {
  /**
   * Specify an optional className to add.
   */
  className: PropTypes.string,
};

export default SkeletonIcon;
