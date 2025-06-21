/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import isEqual from 'react-fast-compare';
import getDerivedStateFromProps from './state/getDerivedStateFromProps';
import { getNextSortState } from './state/sorting';
import type { DataTableSortState } from './state/sortStates';
import { getCellId } from './tools/cells';
import denormalize from './tools/denormalize';
import { composeEventHandlers } from '../../tools/events';
import { defaultFilterRows } from './tools/filter';
import { setupGetInstanceId } from '../../tools/setupGetInstanceId';
import Table from './Table';
import TableActionList from './TableActionList';
import TableBatchAction from './TableBatchAction';
import TableBatchActions from './TableBatchActions';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableContainer from './TableContainer';
import TableDecoratorRow from './TableDecoratorRow';
import TableExpandHeader from './TableExpandHeader';
import TableExpandRow from './TableExpandRow';
import TableExpandedRow from './TableExpandedRow';
import TableHead from './TableHead';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import TableSelectAll from './TableSelectAll';
import TableSelectRow from './TableSelectRow';
import TableSlugRow from './TableSlugRow';
import TableToolbar from './TableToolbar';
import TableToolbarAction from './TableToolbarAction';
import TableToolbarContent from './TableToolbarContent';
import TableToolbarSearch from './TableToolbarSearch';
import TableToolbarMenu from './TableToolbarMenu';
import { TranslateWithId } from '../../types/common';
import deprecate from '../../prop-types/deprecate';

const getInstanceId = setupGetInstanceId();

const translationKeys = {
  expandRow: 'carbon.table.row.expand',
  collapseRow: 'carbon.table.row.collapse',
  expandAll: 'carbon.table.all.expand',
  collapseAll: 'carbon.table.all.collapse',
  selectAll: 'carbon.table.all.select',
  unselectAll: 'carbon.table.all.unselect',
  selectRow: 'carbon.table.row.select',
  unselectRow: 'carbon.table.row.unselect',
} as const;

/**
 * Message ids that will be passed to translateWithId().
 */
type TranslationKey = (typeof translationKeys)[keyof typeof translationKeys];

const defaultTranslations: Record<TranslationKey, string> = {
  [translationKeys.expandAll]: 'Expand all rows',
  [translationKeys.collapseAll]: 'Collapse all rows',
  [translationKeys.expandRow]: 'Expand current row',
  [translationKeys.collapseRow]: 'Collapse current row',
  [translationKeys.selectAll]: 'Select all rows',
  [translationKeys.unselectAll]: 'Unselect all rows',
  [translationKeys.selectRow]: 'Select row',
  [translationKeys.unselectRow]: 'Unselect row',
};

const translateWithId: NonNullable<
  TranslateWithId<TranslationKey>['translateWithId']
> = (id) => defaultTranslations[id];

export type DataTableSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DataTableCell<T> {
  id: string;
  value: T;
  isEditable: boolean;
  isEditing: boolean;
  isValid: boolean;
  errors: null | Error[];
  info: {
    header: string;
  };
  hasAILabelHeader?: boolean;
  hasDecoratorHeader?: boolean;
}

type DataTableCells<T extends any[]> = { [K in keyof T]: DataTableCell<T[K]> };

export interface DataTableRow<ColTypes extends any[]> {
  id: string;
  cells: DataTableCells<ColTypes>;
  disabled?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
}

export interface DataTableHeader {
  key: string;
  header: ReactNode;
  slug?: ReactElement;
  decorator?: ReactElement;
}

export interface DataTableRenderProps<RowType, ColTypes extends any[]> {
  /**
   * The headers for the table.
   */
  headers: DataTableHeader[];

  /**
   * The rows for the table.
   */
  rows: (DataTableRow<ColTypes> & RowType)[];

  /**
   * The rows that are currently selected.
   */
  selectedRows: (DataTableRow<ColTypes> & RowType)[];

  getHeaderProps: (options: {
    header: DataTableHeader;
    isSortable?: boolean;
    onClick?: (
      event: MouseEvent<HTMLButtonElement>,
      sortState: { sortHeaderKey: string; sortDirection: DataTableSortState }
    ) => void;
    [key: string]: unknown;
  }) => {
    isSortable: boolean | undefined;
    isSortHeader: boolean;
    key: string;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    sortDirection: DataTableSortState;
    [key: string]: unknown;
  };

  getExpandHeaderProps: (options?: {
    onClick?: (
      event: MouseEvent<HTMLButtonElement>,
      expandState: { isExpanded?: boolean }
    ) => void;
    onExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
    [key: string]: unknown;
  }) => {
    'aria-label': string;
    isExpanded: boolean;
    onExpand: (event: MouseEvent<HTMLButtonElement>) => void;
    [key: string]: unknown;
  };

  getRowProps: (options: {
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    row: DataTableRow<ColTypes>;
    [key: string]: unknown;
  }) => {
    'aria-label': string;
    disabled: boolean | undefined;
    isExpanded?: boolean;
    isSelected?: boolean;
    key: string;
    onExpand: (event: MouseEvent<HTMLButtonElement>) => void;
    [key: string]: unknown;
  };

  getExpandedRowProps: (options: {
    row: DataTableRow<ColTypes>;
    [key: string]: unknown;
  }) => {
    id: string;
    [key: string]: unknown;
  };

  getSelectionProps: (options?: {
    onClick?: (
      event: MouseEvent<HTMLInputElement, globalThis.MouseEvent>
    ) => void;
    row?: DataTableRow<ColTypes>;
    [key: string]: unknown;
  }) => {
    'aria-label': string;
    checked?: boolean;
    disabled?: boolean;
    id: string;
    indeterminate?: boolean;
    name: string;
    onSelect: (event: MouseEvent<HTMLInputElement>) => void;
    radio?: boolean;
    [key: string]: unknown;
  };

  getToolbarProps: (options?: { [key: string]: unknown }) => {
    size: 'sm' | undefined;
    [key: string]: unknown;
  };

  getBatchActionProps: (options?: { [key: string]: unknown }) => {
    onCancel: () => void;
    onSelectAll?: () => void;
    shouldShowBatchActions: boolean;
    totalCount: number;
    totalSelected: number;
    [key: string]: unknown;
  };

  getTableProps: () => {
    experimentalAutoAlign?: boolean;
    isSortable?: boolean;
    overflowMenuOnHover: boolean;
    size: DataTableSize;
    stickyHeader?: boolean;
    useStaticWidth?: boolean;
    useZebraStyles?: boolean;
  };

  getTableContainerProps: () => {
    stickyHeader?: boolean;
    useStaticWidth?: boolean;
  };

  getCellProps: (options: { cell: DataTableCell<ColTypes> }) => {
    key: string;
    hasAILabelHeader?: boolean;
    hasDecoratorHeader?: boolean;
    [key: string]: unknown;
  };

  /**
   * Handles input value changes.
   */
  onInputChange: (
    event: ChangeEvent<HTMLInputElement>,
    defaultValue?: string
  ) => void;

  /**
   * Sorts the table by a specific header.
   */
  sortBy: (headerKey: string) => void;

  /**
   * Selects all rows.
   */
  selectAll: () => void;

  /**
   * Selects or deselects a specific row.
   */
  selectRow: (rowId: string) => void;

  /**
   * Expands or collapses a specific row.
   */
  expandRow: (rowId: string) => void;

  /**
   * Expands or collapses all rows.
   */
  expandAll: () => void;

  /**
   * Whether the table is using radio buttons for selection instead of
   * checkboxes.
   */
  radio: boolean | undefined;
}

export interface DataTableProps<RowType, ColTypes extends any[]>
  extends TranslateWithId<TranslationKey> {
  children?: (
    renderProps: DataTableRenderProps<RowType, ColTypes>
  ) => ReactElement;
  experimentalAutoAlign?: boolean;
  filterRows?: (options: {
    cellsById: Record<string, DataTableCell<ColTypes>>;
    getCellId: (rowId: string, header: string) => string;
    headers: DataTableHeader[];
    inputValue: string;
    rowIds: string[];
  }) => string[];
  headers: DataTableHeader[];
  isSortable?: boolean;
  locale?: string;
  overflowMenuOnHover?: boolean;
  radio?: boolean;
  /**
   * @deprecated Use the `children` prop instead.
   * https://www.patterns.dev/react/render-props-pattern/#children-as-a-function
   */
  render?: (
    renderProps: DataTableRenderProps<RowType, ColTypes>
  ) => ReactElement;
  rows: Omit<DataTableRow<ColTypes>, 'cells'>[];
  size?: DataTableSize;
  sortRow?: (
    cellA: unknown,
    cellB: unknown,
    options: {
      sortDirection: DataTableSortState;
    }
  ) => number;
  stickyHeader?: boolean;
  useStaticWidth?: boolean;
  useZebraStyles?: boolean;
}

interface DataTableState<ColTypes extends any[]> {
  cellsById: Record<string, DataTableCell<ColTypes>>;
  filterInputValue: string | null;
  initialRowOrder: string[];
  isExpandedAll: boolean;
  rowIds: string[];
  rowsById: Record<string, DataTableRow<ColTypes>>;
  shouldShowBatchActions: boolean;
  sortDirection: DataTableSortState;
  sortHeaderKey: string | null;
}

/**
 * Data Tables are used to represent a collection of resources, displaying a
 * subset of their fields in columns, or headers. We prioritize direct updates
 * to the state of what we're rendering, so internally we end up normalizing the
 * given data and then denormalizing it when rendering.
 *
 * As a result, each part of the DataTable is accessible through look-up by id,
 * and updating the state of the single entity will cascade updates to the
 * consumer.
 */
export const DataTable = <RowType, ColTypes extends any[]>(
  props: DataTableProps<RowType, ColTypes>
) => {
  type RenderProps = DataTableRenderProps<RowType, ColTypes>;

  const {
    children,
    filterRows = defaultFilterRows,
    headers,
    render,
    translateWithId: t = translateWithId,
    size,
    isSortable: isSortableProp,
    useZebraStyles,
    useStaticWidth,
    stickyHeader,
    overflowMenuOnHover,
    experimentalAutoAlign,
    radio,
    rows,
  } = props;

  const instanceId = useMemo(() => getInstanceId(), []);

  const [state, setState] = useState<DataTableState<ColTypes>>(() => ({
    ...getDerivedStateFromProps(props, {}),
    // Initialize to collapsed. A value of `undefined` is treated as neutral.
    isExpandedAll: false,
  }));

  useEffect(() => {
    const nextRowIds = rows.map((row) => row.id);
    const nextHeaders = headers.map((header) => header.key);
    const hasRowIdsChanged = !isEqual(nextRowIds, state.rowIds);
    const currentHeaders = Array.from(
      new Set(Object.keys(state.cellsById).map((id) => id.split(':')[1]))
    );
    const hasHeadersChanged = !isEqual(nextHeaders, currentHeaders);
    const currentRows = state.rowIds.map((id) => state.rowsById[id]);
    const hasRowsChanged = !isEqual(rows, currentRows);

    if (hasRowIdsChanged || hasHeadersChanged || hasRowsChanged) {
      setState((prev) => getDerivedStateFromProps(props, prev));
    }
  }, [headers, rows]);

  const getHeaderProps: RenderProps['getHeaderProps'] = ({
    header,
    onClick,
    isSortable = isSortableProp,
    ...rest
  }) => {
    const { sortDirection, sortHeaderKey } = state;
    const { key, slug, decorator } = header;

    return {
      ...rest,
      key,
      sortDirection,
      isSortable,
      isSortHeader: sortHeaderKey === key,
      slug,
      decorator,
      onClick: (event) => {
        const nextSortState = getNextSortState(props, state, { key });

        setState((prev) => ({ ...prev, ...nextSortState }));

        if (onClick) {
          handleOnHeaderClick(onClick, {
            sortHeaderKey: key,
            sortDirection: nextSortState.sortDirection,
          })(event);
        }
      },
    };
  };

  const getExpandHeaderProps: RenderProps['getExpandHeaderProps'] = ({
    onClick,
    onExpand,
    ...rest
  } = {}) => {
    const { isExpandedAll, rowIds, rowsById } = state;
    const isExpanded =
      isExpandedAll || rowIds.every((id) => rowsById[id].isExpanded);
    const translationKey = isExpanded
      ? translationKeys.collapseAll
      : translationKeys.expandAll;
    return {
      ...rest,
      'aria-label': t(translationKey),
      // Provide a string of all the expanded row id's, separated by a space.
      'aria-controls': rowIds.map((id) => `expanded-row-${id}`).join(' '),
      isExpanded,
      // Compose handlers to preserve consumer's `onClick`.
      onExpand: composeEventHandlers([
        handleOnExpandAll,
        onExpand,
        onClick
          ? handleOnExpandHeaderClick(onClick, { isExpanded })
          : undefined,
      ]),
    };
  };

  /**
   * Wraps the consumer's `onClick` with sorting metadata.
   */
  const handleOnHeaderClick = (
    onClick: (
      event: MouseEvent<HTMLButtonElement>,
      sortParams: { sortHeaderKey: string; sortDirection: DataTableSortState }
    ) => void,
    sortParams: { sortHeaderKey: string; sortDirection: DataTableSortState }
  ) => {
    return (event: MouseEvent<HTMLButtonElement>) => onClick(event, sortParams);
  };

  /**
   * Wraps the consumer's `onClick` with expansion metadata.
   */
  const handleOnExpandHeaderClick = (
    onClick: (
      event: MouseEvent<HTMLButtonElement>,
      expandParams: { isExpanded: boolean }
    ) => void,
    expandParams: { isExpanded: boolean }
  ) => {
    return (event: MouseEvent<HTMLButtonElement>) =>
      onClick(event, expandParams);
  };

  const getRowProps: RenderProps['getRowProps'] = ({
    row,
    onClick,
    ...rest
  }) => {
    const translationKey = row.isExpanded
      ? translationKeys.collapseRow
      : translationKeys.expandRow;
    return {
      ...rest,
      key: row.id,
      onClick,
      // Compose the event handlers so we don't overwrite a consumer's `onClick`
      // handler
      onExpand: composeEventHandlers([handleOnExpandRow(row.id), onClick]),
      isExpanded: row.isExpanded,
      'aria-label': t(translationKey),
      'aria-controls': `expanded-row-${row.id}`,
      isSelected: row.isSelected,
      disabled: row.disabled,
    };
  };

  const getExpandedRowProps: RenderProps['getExpandedRowProps'] = ({
    row,
    ...rest
  }) => {
    return {
      ...rest,
      id: `expanded-row-${row.id}`,
    };
  };

  /**
   * Gets the props associated with selection for a header or a row.
   */
  const getSelectionProps: RenderProps['getSelectionProps'] = ({
    onClick,
    row,
    ...rest
  } = {}) => {
    // If we're given a row, return the selection state values for that row
    if (row) {
      const translationKey = row.isSelected
        ? translationKeys.unselectRow
        : translationKeys.selectRow;
      return {
        ...rest,
        checked: row.isSelected,
        onSelect: composeEventHandlers([handleOnSelectRow(row.id), onClick]),
        id: `${getTablePrefix()}__select-row-${row.id}`,
        name: `select-row-${instanceId}`,
        'aria-label': t(translationKey),
        disabled: row.disabled,
        radio,
      };
    }

    // Otherwise, we're working on `TableSelectAll` which handles toggling the
    // selection state of all rows.
    const rowCount = state.rowIds.length;
    const selectedRowCount = selectedRows.length;
    const checked = rowCount > 0 && selectedRowCount === rowCount;
    const indeterminate =
      rowCount > 0 && selectedRowCount > 0 && selectedRowCount !== rowCount;
    const translationKey =
      checked || indeterminate
        ? translationKeys.unselectAll
        : translationKeys.selectAll;

    return {
      ...rest,
      'aria-label': t(translationKey),
      checked,
      id: `${getTablePrefix()}__select-all`,
      indeterminate,
      name: `select-all-${instanceId}`,
      onSelect: composeEventHandlers([handleSelectAll, onClick]),
    };
  };

  const getToolbarProps: RenderProps['getToolbarProps'] = (props) => {
    const isSmall = size === 'xs' || size === 'sm';
    return {
      ...props,
      size: isSmall ? 'sm' : undefined,
    };
  };

  const getBatchActionProps: RenderProps['getBatchActionProps'] = (props) => {
    const { shouldShowBatchActions } = state;
    const totalSelected = selectedRows.length;

    return {
      onSelectAll: undefined,
      totalCount: state.rowIds.length || 0,
      ...props,
      shouldShowBatchActions: shouldShowBatchActions && totalSelected > 0,
      totalSelected,
      onCancel: handleOnCancel,
    };
  };

  const getTableProps: RenderProps['getTableProps'] = () => {
    return {
      useZebraStyles,
      size: size ?? 'lg',
      isSortable: isSortableProp,
      useStaticWidth,
      stickyHeader,
      overflowMenuOnHover: overflowMenuOnHover ?? false,
      experimentalAutoAlign,
    };
  };

  const getTableContainerProps: RenderProps['getTableContainerProps'] = () => {
    return {
      stickyHeader,
      useStaticWidth,
    };
  };

  const getCellProps: RenderProps['getCellProps'] = ({
    cell: { hasAILabelHeader, hasDecoratorHeader, id },
    ...rest
  }) => {
    return {
      key: id,
      ...rest,
      hasAILabelHeader,
      hasDecoratorHeader,
    };
  };

  /**
   * Selected row IDs, excluding disabled rows.
   */
  const selectedRows = useMemo(
    () =>
      state.rowIds.filter((id) => {
        const row = state.rowsById[id];
        return row.isSelected && !row.disabled;
      }),
    [state.rowsById, state.rowIds]
  );

  /**
   * Computes the list of row IDs that match the current filter input.
   */
  const getFilteredRowIds = () => {
    const filteredRowIds =
      typeof state.filterInputValue === 'string'
        ? filterRows({
            rowIds: state.rowIds,
            headers: headers,
            cellsById: state.cellsById,
            inputValue: state.filterInputValue,
            getCellId,
          })
        : state.rowIds;

    return filteredRowIds;
  };

  const filteredRowIds = getFilteredRowIds();

  /**
   * Generates a prefix for table related IDs.
   */
  const getTablePrefix = () => `data-table-${instanceId}`;

  /**
   * Generates a new `rowsById` object with updated selection state.
   */
  const getUpdatedSelectionState = (
    initialState: DataTableState<ColTypes>,
    isSelected: boolean,
    filteredRowIds: string[]
  ): Pick<DataTableState<ColTypes>, 'rowsById'> => {
    const { rowIds } = initialState;
    const isFiltered = rowIds.length !== filteredRowIds.length;

    return {
      rowsById: rowIds.reduce<Record<string, DataTableRow<ColTypes>>>(
        (acc, id) => {
          const row = { ...initialState.rowsById[id] };
          //  Only modify non-disabled rows and respect filtering.
          if (!row.disabled && (!isFiltered || filteredRowIds.includes(id))) {
            row.isSelected = isSelected;
          }
          acc[id] = row;
          return acc;
        },
        {}
      ),
    };
  };

  /**
   * Handler for the `onCancel` event to hide the batch actions toolbar and
   * deselect all selected rows.
   */
  const handleOnCancel = () => {
    setState((prev) => {
      return {
        ...prev,
        shouldShowBatchActions: false,
        ...getUpdatedSelectionState(prev, false, filteredRowIds),
      };
    });
  };

  /**
   * Handler for toggling the selection state of all rows.
   */
  const handleSelectAll = () => {
    setState((prev) => {
      const { rowsById } = prev;
      const isSelected = !(
        Object.values(rowsById).filter((row) => row.isSelected && !row.disabled)
          .length > 0
      );
      return {
        ...prev,
        shouldShowBatchActions: isSelected,
        ...getUpdatedSelectionState(prev, isSelected, filteredRowIds),
      };
    });
  };

  /**
   * Handler for toggling the selection state of a given row.
   */
  const handleOnSelectRow = (rowId: string) => () => {
    setState((prev) => {
      const row = prev.rowsById[rowId];
      if (radio) {
        // deselect all radio buttons
        const rowsById = Object.entries(prev.rowsById).reduce<
          Record<string, DataTableRow<ColTypes>>
        >((acc, [key, row]) => {
          acc[key] = { ...row, isSelected: false };
          return acc;
        }, {});
        return {
          ...prev,
          shouldShowBatchActions: false,
          rowsById: {
            ...rowsById,
            [rowId]: {
              ...row,
              isSelected: !row.isSelected,
            },
          },
        };
      }
      const selectedRows = prev.rowIds.filter(
        (id) => prev.rowsById[id].isSelected
      ).length;
      // Predict the length of the selected rows after this change occurs
      const selectedRowsCount = !row.isSelected
        ? selectedRows + 1
        : selectedRows - 1;
      return {
        ...prev,
        // Basic assumption here is that we want to show the batch action bar if
        // the row is being selected. If it's being unselected, then see if we
        // have a non-zero number of selected rows that batch actions could
        // still apply to
        shouldShowBatchActions: !row.isSelected || selectedRowsCount > 0,
        rowsById: {
          ...prev.rowsById,
          [rowId]: {
            ...row,
            isSelected: !row.isSelected,
          },
        },
      };
    });
  };

  /**
   * Handler for toggling the expansion state of a given row.
   */
  const handleOnExpandRow = (rowId: string) => () => {
    setState((prev) => {
      const row = prev.rowsById[rowId];
      const { isExpandedAll } = prev;
      return {
        ...prev,
        isExpandedAll: row.isExpanded ? false : isExpandedAll,
        rowsById: {
          ...prev.rowsById,
          [rowId]: {
            ...row,
            isExpanded: !row.isExpanded,
          },
        },
      };
    });
  };

  /**
   * Handler for changing the expansion state of all rows.
   */
  const handleOnExpandAll = () => {
    setState((prev) => {
      const { rowIds, isExpandedAll } = prev;
      return {
        ...prev,
        isExpandedAll: !isExpandedAll,
        rowsById: rowIds.reduce<Record<string, DataTableRow<ColTypes>>>(
          (acc, id) => ({
            ...acc,
            [id]: {
              ...prev.rowsById[id],
              isExpanded: !isExpandedAll,
            },
          }),
          {}
        ),
      };
    });
  };

  /**
   * Handler for transitioning to the next sort state of the table
   */
  const handleSortBy = (headerKey: string) => () => {
    setState((prev) => getNextSortState(props, prev, { key: headerKey }));
  };

  /**
   * Event handler for transitioning input value state changes for the table
   * filter component.
   */
  const handleOnInputValueChange = (
    event: ChangeEvent<HTMLInputElement>,
    defaultValue?: string
  ) => {
    if (event.target) {
      setState((prev) => ({ ...prev, filterInputValue: event.target.value }));
    }

    if (defaultValue) {
      setState((prev) => ({ ...prev, filterInputValue: defaultValue }));
    }
  };

  const renderProps: RenderProps = {
    // Data derived from state
    rows: denormalize(filteredRowIds, state.rowsById, state.cellsById),
    headers: headers,
    selectedRows: denormalize(selectedRows, state.rowsById, state.cellsById),

    // Prop accessors/getters
    getHeaderProps,
    getExpandHeaderProps,
    getRowProps,
    getExpandedRowProps,
    getSelectionProps,
    getToolbarProps,
    getBatchActionProps,
    getTableProps,
    getTableContainerProps,
    getCellProps,

    // Custom event handlers
    onInputChange: handleOnInputValueChange,

    // Expose internal state change actions
    sortBy: (headerKey) => handleSortBy(headerKey)(),
    selectAll: handleSelectAll,
    selectRow: (rowId) => handleOnSelectRow(rowId)(),
    expandRow: (rowId) => handleOnExpandRow(rowId)(),
    expandAll: handleOnExpandAll,
    radio: radio,
  };

  if (typeof children !== 'undefined') {
    return children(renderProps);
  }

  if (typeof render !== 'undefined') {
    return render(renderProps);
  }

  return null;
};

DataTable.translationKeys = Object.values(translationKeys);
DataTable.Table = Table;
DataTable.TableActionList = TableActionList;
DataTable.TableBatchAction = TableBatchAction;
DataTable.TableBatchActions = TableBatchActions;
DataTable.TableBody = TableBody;
DataTable.TableCell = TableCell;
DataTable.TableContainer = TableContainer;
DataTable.TableDecoratorRow = TableDecoratorRow;
DataTable.TableExpandHeader = TableExpandHeader;
DataTable.TableExpandRow = TableExpandRow;
DataTable.TableExpandedRow = TableExpandedRow;
DataTable.TableHead = TableHead;
DataTable.TableHeader = TableHeader;
DataTable.TableRow = TableRow;
DataTable.TableSelectAll = TableSelectAll;
DataTable.TableSelectRow = TableSelectRow;
DataTable.TableSlugRow = TableSlugRow;
DataTable.TableToolbar = TableToolbar;
DataTable.TableToolbarAction = TableToolbarAction;
DataTable.TableToolbarContent = TableToolbarContent;
DataTable.TableToolbarSearch = TableToolbarSearch;
DataTable.TableToolbarMenu = TableToolbarMenu;

DataTable.propTypes = {
  /**
   * Content of the `DataTable`.
   */
  children: PropTypes.func,

  /**
   * Experimental property. Allows table to align cell contents to the top if there is text wrapping in the content. Might have performance issues, intended for smaller tables
   */
  experimentalAutoAlign: PropTypes.bool,

  /**
   * Optional hook to manually control filtering of the rows from the
   * TableToolbarSearch component
   */
  filterRows: PropTypes.func,

  /**
   * The `headers` prop represents the order in which the headers should
   * appear in the table. We expect an array of objects to be passed in, where
   * `key` is the name of the key in a row object, and `header` is the name of
   * the header.
   */
  headers: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node.isRequired,
    })
  ).isRequired,

  /**
   * Specify whether the table should be able to be sorted by its headers
   */
  isSortable: PropTypes.bool,

  /**
   * Provide a string for the current locale
   */
  locale: PropTypes.string,

  /**
   * Specify whether the overflow menu (if it exists) should be shown always, or only on hover
   */
  overflowMenuOnHover: PropTypes.bool,

  /**
   * Specify whether the control should be a radio button or inline checkbox
   */
  radio: PropTypes.bool,

  render: deprecate(PropTypes.func),

  /**
   * The `rows` prop is where you provide us with a list of all the rows that
   * you want to render in the table. The only hard requirement is that this
   * is an array of objects, and that each object has a unique `id` field
   * available on it.
   */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      isSelected: PropTypes.bool,
      isExpanded: PropTypes.bool,
    })
  ).isRequired,

  /**
   *  Change the row height of table. Currently supports `xs`, `sm`, `md`, `lg`, and `xl`.
   */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),

  /**
   * Optional hook to manually control sorting of the rows.
   */
  sortRow: PropTypes.func,

  /**
   * Specify whether the header should be sticky.
   * Still experimental: may not work with every combination of table props
   */
  stickyHeader: PropTypes.bool,

  /**
   * Optional method that takes in a message id and returns an
   * internationalized string. See `DataTable.translationKeys` for all
   * available message ids.
   */
  translateWithId: PropTypes.func,

  /**
   * If `true`, sets the table width to `auto` instead of 100%.
   */
  useStaticWidth: PropTypes.bool,

  /**
   * `true` to add useZebraStyles striping.
   */
  useZebraStyles: PropTypes.bool,
};
