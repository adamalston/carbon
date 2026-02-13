/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableRow } from '../';
import TableSlugRow from '../TableSlugRow';
import { deprecateComponent } from '../../../prop-types/deprecateComponent';

jest.mock('../../../prop-types/deprecateComponent', () => ({
  deprecateComponent: jest.fn(),
}));

const Slug = ({ size }) => <span data-testid="slug" data-size={size} />;

describe('DataTable.TableSlugRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add base and custom classes', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableSlugRow className="pew-pew" />
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByRole('cell');

    expect(cell.className).toEqual('pew-pew cds--table-column-slug');
  });

  it('should normalize the slug size to mini and add active class when slug is present', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableSlugRow slug={<Slug size="xl" />} />
          </TableRow>
        </TableBody>
      </Table>
    );

    const cell = screen.getByRole('cell');

    expect(cell.className).toEqual(
      'cds--table-column-slug cds--table-column-slug--active'
    );
    expect(screen.getByTestId('slug')).toHaveAttribute('data-size', 'mini');
  });

  it('should call `deprecateComponent` on mount', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableSlugRow />
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(deprecateComponent).toHaveBeenCalledTimes(1);
    expect(deprecateComponent).toHaveBeenCalledWith(
      'TableSlugRow',
      'The `TableSlugRow` component has been deprecated and will be removed in the next major version. Use the TableDecoratorRow component instead.'
    );
  });
});
