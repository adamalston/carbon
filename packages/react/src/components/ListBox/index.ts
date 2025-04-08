/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export * as PropTypes from './ListBoxPropTypes';
export * from './ListBoxPropTypes';

import ListBoxInternal from './ListBox';
import ListBoxField, { ListBoxFieldComponent } from './ListBoxField';
import ListBoxMenu from './ListBoxMenu';
import ListBoxMenuIcon, { ListBoxMenuIconComponent } from './ListBoxMenuIcon';
import ListBoxMenuItem, { ListBoxMenuItemComponent } from './ListBoxMenuItem';
import ListBoxSelection, {
  ListBoxSelectionComponent,
} from './ListBoxSelection';

type ListBoxType = typeof ListBoxInternal;
type ListBoxMenuType = typeof ListBoxMenu;

export interface ListBoxComponent extends ListBoxType {
  readonly Field: ListBoxFieldComponent;
  readonly Menu: ListBoxMenuType;
  readonly MenuIcon: ListBoxMenuIconComponent;
  readonly MenuItem: ListBoxMenuItemComponent;
  readonly Selection: ListBoxSelectionComponent;
}

const ListBox: ListBoxComponent = Object.assign(ListBoxInternal, {
  Field: ListBoxField,
  Menu: ListBoxMenu,
  MenuIcon: ListBoxMenuIcon,
  MenuItem: ListBoxMenuItem,
  Selection: ListBoxSelection,
});

export default ListBox;

export type { ListBoxMenuIconTranslationKey } from './ListBoxMenuIcon';
