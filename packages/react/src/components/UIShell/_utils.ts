/**
 * Copyright IBM Corp. 2021, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isValidElement } from 'react';
import { isForwardRef, isMemo } from 'react-is';

import SideNavFooter from './SideNavFooter';
import SideNavHeader from './SideNavHeader';
import SideNavItems from './SideNavItems';
import SideNavLink from './SideNavLink';
import SideNavMenu from './SideNavMenu';

const hasType = (x: unknown): x is { type: unknown } =>
  typeof x === 'object' && x !== null && 'type' in x;

const hasRender = (x: unknown): x is { render: unknown } =>
  typeof x === 'object' && x !== null && 'render' in x;

// const unwrapType = (t: any): any => {
//   if (isMemo(t)) return unwrapType(t.type);
//   if (isForwardRef(t)) return unwrapType(t.render);
//   return t;
// };

/**
 * Returns a stable identity for a component or element by peeling
 * `memo` / `forwardRef` layers.
 */
export const unwrapIdentity = (input: unknown): unknown => {
  const t = isValidElement(input) ? input.type : input;

  if (isMemo(t) && hasType(t)) return unwrapIdentity(t.type);
  if (isForwardRef(t) && hasRender(t)) return unwrapIdentity(t.render);

  return t;
};

// export const CARBON_SIDENAV_ITEMS = [
//   'SideNavFooter',
//   'SideNavHeader',
//   'SideNavItems',
//   'SideNavMenu',
//   'SideNavLink',
// ];

export const CARBON_SIDENAV_ITEMS = new Set([
  unwrapIdentity(SideNavMenu),
  unwrapIdentity(SideNavHeader),
  unwrapIdentity(SideNavFooter),
  unwrapIdentity(SideNavLink),
  unwrapIdentity(SideNavItems),
]);
