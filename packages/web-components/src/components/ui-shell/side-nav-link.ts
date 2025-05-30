/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { prefix } from '../../globals/settings';
import FocusMixin from '../../globals/mixins/focus';
import styles from './side-nav.scss?lit';
import { carbonElement as customElement } from '../../globals/decorators/carbon-element';

/**
 * Side nav menu item.
 *
 * @element cds-side-nav-link
 * @slot link - The link.
 * @slot title - The title.
 * @slot title-icon-container - The title icon container.
 */
@customElement(`${prefix}-side-nav-link`)
class CDSSideNavLink extends FocusMixin(LitElement) {
  /**
   * The container for the title icon.
   */
  @query('#title-icon-container')
  private _titleIconContainerNode!: HTMLDivElement;

  /**
   * Handles `slotchange` event on the `<slot>` for the title icon.
   */
  private _handleSlotChangeTitleIcon({ target }) {
    this._titleIconContainerNode?.toggleAttribute(
      'hidden',
      target.assignedNodes().length === 0
    );
  }

  /**
   * `true` if the menu item should be active.
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  /**
   * Link `href`.
   */
  @property()
  href = '';

  /**
   * The link type.
   */
  @property({ reflect: true })
  rel!: string;

  /**
   * The link target.
   */
  @property({ reflect: true })
  target!: string;

  /**
   * Specify if this is a large variation of the side nav link
   */
  @property({ type: Boolean, reflect: true })
  large = false;

  /**
   * The title.
   */
  @property()
  title!: string;

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
    super.connectedCallback();
  }

  render() {
    const {
      active,
      href,
      rel,
      target,
      title,
      _handleSlotChangeTitleIcon: handleSlotChangeTitleIcon,
    } = this;
    const classes = classMap({
      [`${prefix}--side-nav__link`]: true,
      [`${prefix}--side-nav__link--current`]: active,
    });
    return html`
      <a
        part="link"
        class="${classes}"
        href="${href}"
        rel="${ifDefined(rel)}"
        target="${ifDefined(target)}">
        <div
          id="title-icon-container"
          part="title-icon-container"
          hidden
          class="${prefix}--side-nav__icon">
          <slot
            name="title-icon"
            @slotchange=${handleSlotChangeTitleIcon}></slot>
        </div>
        <span part="title" class="${prefix}--side-nav__link-text">
          <slot>${title}</slot>
        </span>
      </a>
    `;
  }

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static styles = styles;
}

export default CDSSideNavLink;
