/**
 * Copyright IBM Corp. 2019, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { classMap } from 'lit/directives/class-map.js';
import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { carbonElement as customElement } from '../../globals/decorators/carbon-element';
import { prefix } from '../../globals/settings';
import styles from './popover.scss?lit';
import CDSPopoverContent from './popover-content';
import HostListener from '../../globals/decorators/host-listener';
import HostListenerMixin from '../../globals/mixins/host-listener';
import FloatingUIContoller from '../../globals/controllers/floating-controller';

/**
 * Popover.
 *
 * @element cds-popover
 */
@customElement(`${prefix}-popover`)
class CDSPopover extends HostListenerMixin(LitElement) {
  /**
   * Create popover controller instance
   */
  private popoverController = new FloatingUIContoller(this);

  /**
   * The `<slot>` element in the shadow DOM.
   */
  @query('slot')
  private _triggerSlotNode!: HTMLSlotElement;

  /**
   * The `<slot>` element in the shadow DOM.
   */
  @query('slot[name="content"]')
  private _contentSlotNode!: HTMLSlotElement;

  /**
   * Specify direction of alignment
   */
  @property({ reflect: true, type: String })
  align = '';

  /**
   * Specify whether a auto align functionality should be applied
   */
  @property({ type: Boolean, reflect: true })
  autoalign = false;

  /**
   * Specify whether a caret should be rendered
   */
  @property({ type: Boolean, reflect: true })
  caret = true;

  /**
   * Specify whether a dropShadow should be rendered
   */
  @property({ type: Boolean, reflect: true })
  dropShadow = true;

  /**
   * Render the component using the high-contrast variant
   */
  @property({ type: Boolean, reflect: true })
  highContrast = false;

  /**
   * Specify whether the component is currently open or closed
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Render the component using the tab tip variant
   */
  @property({ type: Boolean, reflect: true })
  tabTip = false;

  /**
   * Handles `slotchange` event.
   */
  protected _handleSlotChange({ target }: Event) {
    if (this.tabTip) {
      const component = (target as HTMLSlotElement)
        .assignedNodes()
        .filter(
          (node) =>
            node.nodeType !== Node.TEXT_NODE || node!.textContent!.trim()
        );
      (component[0] as HTMLElement).classList.add(
        `${prefix}--popover--tab-tip__button`
      );
    }
    this.requestUpdate();
  }

  @HostListener('focusout')
  // @ts-ignore
  private _handleFocusOut(event: Event) {
    const relatedTarget = (event as FocusEvent).relatedTarget as Node | null;
    if (!this.contains(relatedTarget)) {
      this.open = false;
    }
  }

  private _handleOutsideClick(event: Event) {
    const target = event.target as Node | null;
    if (this.open && target && !this.contains(target)) {
      this.open = false;
    }
  }

  constructor() {
    super();
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._handleOutsideClick);
  }

  updated(changedProperties) {
    const { selectorPopoverContent } = this.constructor as typeof CDSPopover;
    ['open', 'align', 'autoalign', 'caret', 'dropShadow', 'tabTip'].forEach(
      (name) => {
        if (changedProperties.has(name)) {
          const { [name as keyof CDSPopover]: value } = this;
          if (this.querySelector(selectorPopoverContent) as CDSPopoverContent) {
            (this.querySelector(selectorPopoverContent) as CDSPopoverContent)[
              name
            ] = value;
          }
        }
      }
    );

    if (this.autoalign && this.open) {
      // auto align functionality with @floating-ui/dom library
      const button = this._triggerSlotNode.assignedElements()[0];
      const content = this._contentSlotNode.assignedElements()[0];

      const tooltip = content?.shadowRoot?.querySelector(
        CDSPopover.selectorPopoverContentClass
      );
      const arrowElement = content?.shadowRoot?.querySelector(
        CDSPopover.selectorPopoverCaret
      );

      if (button && tooltip) {
        this.popoverController?.setPlacement({
          trigger: button as HTMLElement,
          target: tooltip as HTMLElement,
          arrowElement:
            this.caret && arrowElement
              ? (arrowElement as HTMLElement)
              : undefined,
          caret: this.caret,
          flipArguments: { fallbackAxisSideDirection: 'start' },
          alignment: this.align,
          open: this.open,
        });
      }
    }
  }

  render() {
    const {
      dropShadow,
      highContrast,
      open,
      tabTip,
      _handleSlotChange: handleSlotChange,
    } = this;
    if (tabTip) {
      this.caret = tabTip ? false : true;
    }
    this.align = this.align ? this.align : tabTip ? 'bottom-left' : 'bottom';

    const classes = classMap({
      [`${prefix}--popover-container`]: true,
      [`${prefix}--popover--caret`]: this.caret,
      [`${prefix}--popover--drop-shadow`]: dropShadow,
      [`${prefix}--popover--high-contrast`]: highContrast,
      [`${prefix}--popover--open`]: open,
      [`${prefix}--popover--${this.align}`]: true,
      [`${prefix}--popover--tab-tip`]: tabTip,
    });
    return html`
    <span class="${classes}" part="popover-container">
      <slot @slotchange="${handleSlotChange}"></slot>
      <slot name="content"><slot>
    </span>
    `;
  }

  /**
   * A selector that will return popover content element within
   * CDSPopoverContent's shadowRoot.
   */
  static get selectorPopoverContentClass() {
    return `.${prefix}--popover-content`;
  }

  /**
   * A selector that will return popover caret element within
   * CDSPopoverContent's shadowRoot.
   */
  static get selectorPopoverCaret() {
    return `.${prefix}--popover-caret`;
  }

  /**
   * A selector that will return the CDSPopoverContent.
   */
  static get selectorPopoverContent() {
    return `${prefix}-popover-content`;
  }

  static styles = styles;
}

export default CDSPopover;
