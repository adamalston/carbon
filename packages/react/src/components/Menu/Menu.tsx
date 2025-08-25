/**
 * Copyright IBM Corp. 2023, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cx from 'classnames';
import PropTypes from 'prop-types';
import React, {
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size as sizeMiddleware,
  useFloating,
  type VirtualElement,
} from '@floating-ui/react-dom';

import { keys, match } from '../../internal/keyboard';
import { useMergedRefs } from '../../internal/useMergedRefs';
import { usePrefix } from '../../internal/usePrefix';
import { deprecate } from '../../prop-types/deprecate';

import { MenuContext, menuReducer } from './MenuContext';
import { useLayoutDirection } from '../LayoutDirection';
import { canUseDOM } from '../../internal/environment';

const spacing = 8; // distance to keep to window edges, in px

export interface MenuProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * The ref of the containing element, used for positioning and alignment of the menu
   */
  containerRef?: RefObject<HTMLDivElement | null>;
  /**
   * A collection of MenuItems to be rendered within this Menu.
   */
  children?: ReactNode;

  /**
   * Additional CSS class names.
   */
  className?: string;

  /**
   * A label describing the Menu.
   */
  label: string;

  /**
   * Specify how the menu should align with the button element
   */
  menuAlignment?: string;

  /**
   * @deprecated Menus now always support both icons as well as selectable items and nesting.
   * The mode of this menu. Defaults to full.
   * `full` supports nesting and selectable menu items, but no icons.
   * `basic` supports icons but no nesting or selectable menu items.
   *
   * **This prop is not intended for use and will be set by the respective implementation (like useContextMenu, MenuButton, and ComboButton).**
   */
  mode?: 'full' | 'basic';

  /**
   * Provide an optional function to be called when the Menu should be closed,
   * including if the Menu is blurred, the user presses escape, or the Menu is
   * a submenu and the user presses ArrowLeft.
   */
  onClose?: () => void;

  /**
   * Provide an optional function to be called when the Menu is opened.
   */
  onOpen?: () => void;

  /**
   * Whether the Menu is open or not.
   */
  open?: boolean;

  /**
   * Specify the size of the Menu.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /**
   * Specify a DOM node where the Menu should be rendered in. Defaults to document.body.
   */
  target?: Element;

  /**
   * Specify the x position of the Menu. Either pass a single number or an array with two numbers describing your activator's boundaries ([x1, x2])
   */
  x?: number | [number, number];

  /**
   * Specify the y position of the Menu. Either pass a single number or an array with two numbers describing your activator's boundaries ([y1, y2])
   */
  y?: number | [number, number];

  legacyAutoalign?: boolean;

  // TODO: Add prop-types.
  renderStrategy?: 'portal' | 'top-layer' | 'inline';
}

const Menu = forwardRef<HTMLUListElement, MenuProps>((props, forwardedRef) => {
  const {
    children,
    className,
    containerRef,
    label,
    menuAlignment,
    mode,
    onClose,
    onOpen,
    open,
    size = 'sm',
    legacyAutoalign = true,
    target = canUseDOM ? document.body : undefined,
    x = 0,
    y = 0,
    renderStrategy,
    ...rest
  } = props;

  const prefix = usePrefix();

  const focusReturn = useRef<HTMLElement | null>(null);

  const context = useContext(MenuContext);

  const isRoot = context.state.isRoot;

  const menuSize = isRoot ? size : context.state.size;

  const [childState, childDispatch] = useReducer(menuReducer, {
    ...context.state,
    isRoot: false,
    size,
    requestCloseRoot: isRoot ? handleClose : context.state.requestCloseRoot,
  });
  const childContext = useMemo(() => {
    return {
      state: childState,
      dispatch: childDispatch,
    };
  }, [childState, childDispatch]);

  const menu = useRef<HTMLUListElement>(null);
  const ref = useMergedRefs([forwardedRef, menu]);

  const [position, setPosition] = useState([-1, -1]);

  const virtualRef = useRef<VirtualElement>(null);

  const {
    refs,
    floatingStyles,
    update,
    // TODO: Do I need this `placement` property somewhere?
    placement,
  } = useFloating({
    strategy: 'fixed',
    placement:
      menuAlignment === 'bottom-end' ||
      menuAlignment === 'bottom-start' ||
      menuAlignment === 'top'
        ? menuAlignment
        : 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      shift({ padding: spacing }),
      sizeMiddleware({
        apply({ availableWidth, elements }) {
          if (containerRef?.current) {
            const w = containerRef.current.getBoundingClientRect().width;
            elements.floating.style.maxWidth = `${Math.min(availableWidth, w)}px`;
          } else {
            elements.floating.style.maxWidth = `${availableWidth}px`;
          }
        },
        padding: spacing,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (containerRef?.current) {
      refs.setReference(containerRef.current);
    } else {
      // build a virtual reference from x/y
      virtualRef.current = {
        getBoundingClientRect: () => {
          const [vx1, vx2] = Array.isArray(x) ? x : [x, x];
          const [vy1, vy2] = Array.isArray(y) ? y : [y, y];

          const left = Math.min(vx1, vx2);
          const right = Math.max(vx1, vx2);
          const top = Math.min(vy1, vy2);
          const bottom = Math.max(vy1, vy2);
          const width = Math.max(0, right - left);
          const height = Math.max(0, bottom - top);

          return new DOMRect(left, top, width, height);
        },
      };
      refs.setReference(virtualRef.current);
    }
  }, [containerRef, x, y, refs]);

  const supportsPopover =
    typeof HTMLElement !== 'undefined' &&
    'showPopover' in HTMLElement.prototype;
  const popoverSupported = supportsPopover && renderStrategy === 'top-layer';
  const popoverRef = useRef<HTMLUListElement>(null);

  // Set RTL based on the document direction or `LayoutDirection`
  const { direction } = useLayoutDirection();

  useEffect(() => {
    if (!open) {
      if (popoverSupported && popoverRef.current?.hidePopover) {
        popoverRef.current.hidePopover();
      }

      setPosition([-1, -1]);

      return;
    }

    if (popoverSupported && popoverRef.current?.showPopover) {
      popoverRef.current.showPopover();
    }

    if (!legacyAutoalign && refs.floating.current) {
      update();
    } else if (legacyAutoalign && menu.current) {
      const pos = calculatePosition();

      if (
        (document?.dir === 'rtl' || direction === 'rtl') &&
        !rest?.id?.includes('MenuButton')
      ) {
        menu.current.style.insetInlineStart = `initial`;
        menu.current.style.insetInlineEnd = `${pos[0]}px`;
      } else {
        menu.current.style.insetInlineStart = `${pos[0]}px`;
        menu.current.style.insetInlineEnd = `initial`;
      }

      menu.current.style.insetBlockStart = `${pos[1]}px`;

      setPosition(pos);
    }

    menu.current?.focus();
    onOpen?.();
  }, [open, legacyAutoalign, popoverSupported, update, direction]);

  const focusableItems = childContext.state.items.filter(
    (item) => !item.disabled && item.ref.current
  );

  // Getting the width from the parent container element - controlled
  let actionButtonWidth: number | undefined;
  if (containerRef?.current) {
    const { width: w } = containerRef.current.getBoundingClientRect();
    actionButtonWidth = w;
  }

  function returnFocus() {
    if (focusReturn.current) {
      focusReturn.current.focus();
    }
  }

  function handleOpen() {
    if (menu.current) {
      focusReturn.current = document.activeElement as HTMLElement;
      if (legacyAutoalign) {
        const pos = calculatePosition();
        if (
          (document?.dir === 'rtl' || direction === 'rtl') &&
          !rest?.id?.includes('MenuButton')
        ) {
          menu.current.style.insetInlineStart = `initial`;
          menu.current.style.insetInlineEnd = `${pos[0]}px`;
        } else {
          menu.current.style.insetInlineStart = `${pos[0]}px`;
          menu.current.style.insetInlineEnd = `initial`;
        }

        menu.current.style.insetBlockStart = `${pos[1]}px`;
        setPosition(pos);
      }

      menu.current.focus();

      if (onOpen) {
        onOpen();
      }
    }
  }

  function handleClose() {
    // Removed because clicking a 'Share with' item in
    // http://localhost:3000/?path=/story/components-menu--default would return
    // the focus to 'Share with' instead of keeping it on that item.
    // returnFocus();

    // Then let the parent close the menu (this may unmount the portal)
    if (onClose) {
      onClose();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    e.stopPropagation();

    // if the user presses escape or this is a submenu
    // and the user presses ArrowLeft, close it
    if (
      (match(e, keys.Escape) || (!isRoot && match(e, keys.ArrowLeft))) &&
      onClose
    ) {
      handleClose();
    } else {
      focusItem(e);
    }
  }

  function focusItem(e?: KeyboardEvent<HTMLUListElement>) {
    const currentItem = focusableItems.findIndex((item) =>
      item.ref?.current?.contains(document.activeElement)
    );
    let indexToFocus = currentItem;

    // if currentItem is -1, no menu item is focused yet.
    // in this case, the first item should receive focus.
    if (currentItem === -1) {
      indexToFocus = 0;
    } else if (e) {
      if (match(e, keys.ArrowUp)) {
        indexToFocus = indexToFocus - 1;
      }
      if (match(e, keys.ArrowDown)) {
        indexToFocus = indexToFocus + 1;
      }
    }

    if (indexToFocus < 0) {
      indexToFocus = focusableItems.length - 1;
    }
    if (indexToFocus >= focusableItems.length) {
      indexToFocus = 0;
    }

    if (indexToFocus !== currentItem) {
      const nodeToFocus = focusableItems[indexToFocus];
      nodeToFocus.ref?.current?.focus();
      e?.preventDefault();
    }
  }

  function handleBlur(e: FocusEvent<HTMLUListElement>) {
    if (open && onClose && isRoot && !menu.current?.contains(e.relatedTarget)) {
      handleClose();
    }
  }

  function fitValue(range: number[], axis: 'x' | 'y') {
    if (!menu.current) {
      return;
    }

    const { width, height } = menu.current.getBoundingClientRect();
    const alignment = isRoot ? 'vertical' : 'horizontal';

    const axes = {
      x: {
        max: window.innerWidth,
        size: width,
        anchor: alignment === 'horizontal' ? range[1] : range[0],
        reversedAnchor: alignment === 'horizontal' ? range[0] : range[1],
        offset: 0,
      },
      y: {
        max: window.innerHeight,
        size: height,
        anchor: alignment === 'horizontal' ? range[0] : range[1],
        reversedAnchor: alignment === 'horizontal' ? range[1] : range[0],
        offset: isRoot ? 0 : 4, // top padding in menu, used to align the menu items
      },
    };

    // Avoid that the Menu render incorrectly when the position is set in the right side of the screen
    if (
      actionButtonWidth &&
      actionButtonWidth < axes.x.size &&
      (menuAlignment === 'bottom' || menuAlignment === 'top')
    ) {
      axes.x.size = actionButtonWidth;
    }

    // if 'axes.x.anchor' is lower than 87px dynamically switch render side
    if (
      actionButtonWidth &&
      (menuAlignment === 'bottom-end' || menuAlignment === 'top-end') &&
      axes.x.anchor >= 87 &&
      actionButtonWidth < axes.x.size
    ) {
      const diff = axes.x.anchor + axes.x.reversedAnchor;
      axes.x.anchor = axes.x.anchor + diff;
    }

    const { max, size, anchor, reversedAnchor, offset } = axes[axis];

    // get values for different scenarios, set to false if they don't work
    const options = [
      // towards max (preferred)
      max - spacing - size - anchor >= 0 ? anchor - offset : false,

      // towards min / reversed (first fallback)
      reversedAnchor - size >= 0 ? reversedAnchor - size + offset : false,

      // align at max (second fallback)
      max - spacing - size,
    ];

    const topAlignment =
      menuAlignment === 'top' ||
      menuAlignment === 'top-end' ||
      menuAlignment === 'top-start';

    // If the tooltip is not visible in the top, switch to the bottom
    if (
      typeof options[0] === 'number' &&
      topAlignment &&
      options[0] >= 0 &&
      !options[1] &&
      axis === 'y'
    ) {
      menu.current.style.transform = 'translate(0)';
    } else if (topAlignment && !options[0] && axis === 'y') {
      options[0] = anchor - offset;
    }

    // Previous array `options`, has at least one item that is a number (the last one - second fallback).
    // That guarantees that the return of `find()` will always be a number
    // and we can safely add the numeric casting `as number`.
    const bestOption = options.find((option) => option !== false) as number;

    return bestOption >= spacing ? bestOption : spacing;
  }

  function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }

  function getPosition(x: number | (number | null | undefined)[]) {
    if (Array.isArray(x)) {
      // has to be of length 2
      const filtered = x.filter(notEmpty);
      if (filtered.length === 2) {
        return filtered;
      } else {
        return;
      }
    } else {
      return [x, x];
    }
  }

  function calculatePosition() {
    const ranges = {
      x: getPosition(x),
      y: getPosition(y),
    };

    if (!ranges.x || !ranges.y) {
      return [-1, -1];
    }

    return [fitValue(ranges.x, 'x') ?? -1, fitValue(ranges.y, 'y') ?? -1];
  }

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => {
        if (focusableItems.length > 0) {
          focusItem();
        }
      });

      return () => cancelAnimationFrame(raf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focusableItems]);

  useEffect(() => {
    if (open) {
      handleOpen();
    } else {
      // If the portal unmounts, drop the focus to `body`, restore it again
      // after commit.
      returnFocus();

      setPosition([-1, -1]);
    }
  }, [open]);

  const classNames = cx(
    className,
    `${prefix}--menu`,
    `${prefix}--menu--${menuSize}`,
    {
      // --open sets visibility and --shown sets opacity.
      // visibility is needed for focusing elements.
      // opacity is only set once the position has been set correctly
      // to avoid a flicker effect when opening.
      // [`${prefix}--menu--box-shadow-top`]: menuAlignment?.startsWith('top'),
      [`${prefix}--menu--box-shadow-top`]:
        menuAlignment && menuAlignment.slice(0, 3) === 'top',
      [`${prefix}--menu--open`]: open,
      [`${prefix}--menu--shown`]:
        (open && !legacyAutoalign) || (position[0] >= 0 && position[1] >= 0),
      [`${prefix}--menu--with-icons`]: childContext.state.hasIcons,
      [`${prefix}--menu--with-selectable-items`]:
        childContext.state.hasSelectableItems,
      [`${prefix}--autoalign`]: !legacyAutoalign,
    }
  );

  const rendered = (
    <MenuContext.Provider value={childContext}>
      <ul
        {...rest}
        className={classNames}
        role="menu"
        ref={(node) => {
          (ref as any)(node);
          popoverRef.current = node;
          refs.setFloating(node);
        }}
        aria-label={label}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        {...(renderStrategy === 'top-layer' ? { popover: 'auto' } : {})}
        style={!legacyAutoalign ? { ...floatingStyles } : undefined}>
        {children}
      </ul>
    </MenuContext.Provider>
  );

  if (!renderStrategy || renderStrategy === 'portal') {
    if (!target) return rendered;

    return isRoot ? (open && createPortal(rendered, target)) || null : rendered;
  }

  return rendered;
});

Menu.propTypes = {
  /**
   * A collection of MenuItems to be rendered within this Menu.
   */
  children: PropTypes.node,

  /**
   * Additional CSS class names.
   */
  className: PropTypes.string,

  /**
   * A label describing the Menu.
   */
  // @ts-ignore-next-line -- avoid spurious (?) TS2322 error
  label: PropTypes.string,

  /**
   * Specify how the menu should align with the button element
   */
  menuAlignment: PropTypes.string,

  /**
   * **Deprecated**: Menus now always support both icons as well as selectable items and nesting.
   * The mode of this menu. Defaults to full.
   * `full` supports nesting and selectable menu items, but no icons.
   * `basic` supports icons but no nesting or selectable menu items.
   *
   * **This prop is not intended for use and will be set by the respective implementation (like useContextMenu, MenuButton, and ComboButton).**
   */
  mode: deprecate(
    PropTypes.oneOf(['full', 'basic']),
    'Menus now always support both icons as well as selectable items and nesting.'
  ),

  /**
   * Provide an optional function to be called when the Menu should be closed,
   * including if the Menu is blurred, the user presses escape, or the Menu is
   * a submenu and the user presses ArrowLeft.
   */
  onClose: PropTypes.func,

  /**
   * Provide an optional function to be called when the Menu is opened.
   */
  onOpen: PropTypes.func,

  /**
   * Whether the Menu is open or not.
   */
  open: PropTypes.bool,

  /**
   * Specify the size of the Menu.
   */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),

  /**
   * Specify a DOM node where the Menu should be rendered in. Defaults to document.body.
   */
  // @ts-ignore-next-line -- avoid spurious (?) TS2322 error
  target: PropTypes.object,

  /**
   * Specify the x position of the Menu. Either pass a single number or an array with two numbers describing your activator's boundaries ([x1, x2])
   */
  // @ts-ignore-next-line -- avoid spurious (?) TS2322 error
  x: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),

  /**
   * Specify the y position of the Menu. Either pass a single number or an array with two numbers describing your activator's boundaries ([y1, y2])
   */
  // @ts-ignore-next-line -- avoid spurious (?) TS2322 error
  y: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
};

export { Menu };
