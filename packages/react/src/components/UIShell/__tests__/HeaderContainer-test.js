/**
 * Copyright IBM Corp. 2016, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { act } from 'react';
import { breakpoints } from '@carbon/layout';

import { HeaderContainer } from '../';
import userEvent from '@testing-library/user-event';

describe('HeaderContainer', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('should support rendering through a render prop', () => {
    const renderProp = jest.fn(() => null);
    render(<HeaderContainer render={renderProp} />);
    expect(renderProp).toHaveBeenCalled();
    expect(renderProp).toHaveBeenCalledWith(
      {
        isSideNavExpanded: false,
        onClickSideNavExpand: expect.any(Function),
      },
      undefined
    );
  });

  it('should call the `render` prop any time the state changes', () => {
    let _onClickSideNavExpand;
    const renderProp = jest.fn(({ onClickSideNavExpand }) => {
      _onClickSideNavExpand = onClickSideNavExpand;
      return null;
    });
    render(<HeaderContainer render={renderProp} isSideNavExpanded />);

    expect(renderProp).toHaveBeenCalledWith(
      {
        isSideNavExpanded: true,
        onClickSideNavExpand: expect.any(Function),
      },
      undefined
    );

    act(() => {
      _onClickSideNavExpand();
    });

    expect(renderProp).toHaveBeenCalledWith(
      {
        isSideNavExpanded: false,
        onClickSideNavExpand: expect.any(Function),
      },
      undefined
    );
  });

  it('should pass through rest props', () => {
    const rest = {
      foo: 'foo',
      bar: /bar/,
    };
    const Test = jest.fn(() => <div />);

    render(<HeaderContainer render={Test} {...rest} />);

    expect(Test).toHaveBeenCalledWith(
      {
        isSideNavExpanded: false,
        onClickSideNavExpand: expect.any(Function),
        ...rest,
      },
      undefined
    );
  });

  it('should close the side nav on Escape', async () => {
    const renderProp = jest.fn(() => null);

    render(<HeaderContainer render={renderProp} isSideNavExpanded />);

    await userEvent.keyboard('[Escape]');
    expect(renderProp).toHaveBeenCalledWith(
      {
        isSideNavExpanded: false,
        onClickSideNavExpand: expect.any(Function),
      },
      undefined
    );
  });

  it('should keep non-side-nav panels expanded at the lg breakpoint', () => {
    let onClickSideNavExpand;
    const renderProp = jest.fn(({ onClickSideNavExpand: onClick }) => {
      onClickSideNavExpand = onClick;
      return null;
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === `(min-width: ${breakpoints.lg.width})`,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<HeaderContainer render={renderProp} />);

    act(() => {
      onClickSideNavExpand();
    });

    expect(renderProp).toHaveBeenLastCalledWith(
      {
        isSideNavExpanded: true,
        onClickSideNavExpand: expect.any(Function),
      },
      undefined
    );
  });
});
