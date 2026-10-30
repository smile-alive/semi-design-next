import { flushSync } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { ColumnProps, TableHandle, TableProps } from '../interface';
import TableHost from './table-host.svelte';

export const P = `${BASE_CLASS_PREFIX}-table`;

export type SnippetName = 'cell' | 'headerCell' | 'title' | 'footer' | 'empty' | 'expandedRow' | 'groupSection' | 'filterDropdown' | 'selectionCell' | 'sortIcon' | 'filterIcon' | 'expandIcon' | 'paginationContent';

export const queryAll = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) => Array.from(root.querySelectorAll<E>(selector));
export const query = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<E>(selector) as E;
export const getBodyRows = () => queryAll(`.${P}-tbody .${P}-row`);
export const getHeads = () => queryAll(`.${P}-thead .${P}-row-head`);
export const rowKeys = () => getBodyRows().map((row) => row.getAttribute('data-row-key'));
/** The text of the first data cell of each body row */
export const firstCellTexts = () => getBodyRows().map((row) => row.querySelector(`.${P}-row-cell:not(.${P}-column-selection):not(.${P}-column-expand)`)?.textContent?.trim());
export const getRowCheckboxInputs = () => queryAll<HTMLInputElement>(`.${P}-tbody .${P}-column-selection input[type="checkbox"]`);
export const getHeaderCheckboxInput = () => query<HTMLInputElement>(`.${P}-thead .${P}-column-selection input[type="checkbox"]`);
export const getSorters = () => queryAll<HTMLButtonElement>(`.${P}-thead .${P}-column-sorter-wrapper`);
export const getFilterButtons = () => queryAll<HTMLButtonElement>(`.${P}-thead .${P}-column-filter`);
export const getExpandButtons = () => queryAll<HTMLButtonElement>(`.${P}-tbody .${P}-expand-icon`);
export const getDropdownItems = () => queryAll(`.${BASE_CLASS_PREFIX}-dropdown-item`);
export function getPageItem(text: string) {
    const item = queryAll(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item`).find((node) => node.textContent?.trim() === text);
    if (!item) throw new Error(`no page item ${text}`);
    return item;
}

export const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address' },
];

export const getData = () => [
    { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
    { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
    { key: '3', name: 'Joe Black', age: 28, address: 'Sidney No. 1 Lake Park' },
    { key: '4', name: 'Lisa', age: 36, address: 'Paris' },
];

/** Renders a Table from a reactive store; change `store.props` then call `flushSync()` */
export function mountTable(props: TableProps, snippets: SnippetName[] = [], wrapperStyle?: string) {
    const store = createStore<{ props: TableProps; snippets: SnippetName[]; wrapperStyle?: string }>({ props, snippets, wrapperStyle });
    const result = render(TableHost, { props: { store } });
    return { store, container: result.container, handle: () => result.component.handle() as TableHandle };
}

export async function click(element: Element) {
    await fireEvent.click(element);
    flushSync();
}
