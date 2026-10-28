/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive, shallowRef } from 'vue';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Table, { type ColumnProps, type TableHandle } from '..';

/** Shared by the feature test files: mounting a Table with h() and reading its rows */

export const P = `${BASE_CLASS_PREFIX}-table`;

export type Row = Record<string, any>;
export type Slots = Record<string, (...args: any[]) => unknown>;

export const queryAll = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) => Array.from(root.querySelectorAll<E>(selector));
export const query = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<E>(selector) as E;
export const getBodyRows = () => queryAll(`.${P}-tbody .${P}-row`);
export const getHeads = () => queryAll(`.${P}-thead .${P}-row-head`);
export const rowKeys = () => getBodyRows().map((row) => row.getAttribute('data-row-key'));
export const cellTexts = (row: Element) => Array.from(row.children, (cell) => cell.textContent);
/** The text of the first data cell of each body row */
export const firstCellTexts = () => getBodyRows().map((row) => row.querySelector(`.${P}-row-cell:not(.${P}-column-selection)`)?.textContent);
export const getFirstCellText = () => firstCellTexts()[0];
export const getPageItems = () => queryAll(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item`);
export const getActivePage = () => query(`.${BASE_CLASS_PREFIX}-page .${BASE_CLASS_PREFIX}-page-item-active`);
export const getHeaderCheckbox = () => query(`.${P}-thead .${P}-column-selection .${BASE_CLASS_PREFIX}-checkbox`);
/** The checkbox inputs of the body rows, in order */
export const getRowCheckboxInputs = () => queryAll<HTMLInputElement>(`.${P}-tbody .${P}-column-selection input[type="checkbox"]`);
export const getHeaderCheckboxInput = () => query<HTMLInputElement>(`.${P}-thead .${P}-column-selection input[type="checkbox"]`);
export const getSorters = () => queryAll<HTMLButtonElement>(`.${P}-thead .${P}-column-sorter-wrapper`);
export const getFilterButtons = () => queryAll<HTMLButtonElement>(`.${P}-thead .${P}-column-filter`);
export const getExpandButtons = () => queryAll<HTMLButtonElement>(`.${P}-tbody .${P}-expand-icon`);
export const getDropdownItems = () => queryAll(`.${BASE_CLASS_PREFIX}-dropdown-item`);

/** Table written with h(); `update` merges props, replaces the slots and waits for the render */
export function mountTable(props: Record<string, unknown>, slots: Slots = {}) {
    const state = shallowReactive({ props, slots });
    const handle = shallowRef<TableHandle | null>(null);
    const result = render(
        defineComponent(() => () => (
            <Table {...state.props} ref={handle}>
                {state.slots}
            </Table>
        ))
    );
    return {
        container: result.container,
        unmount: () => result.unmount(),
        handle: () => handle.value as TableHandle,
        update: async (next: { props?: Record<string, unknown>; slots?: Slots }) => {
            state.props = { ...state.props, ...next.props };
            state.slots = { ...(next.slots ?? state.slots) };
            await nextTick();
        },
    };
}

export const getColumns = (): ColumnProps[] => [
    { title: 'Name', dataIndex: 'name', width: 150 },
    { title: 'Age', dataIndex: 'age', width: 150 },
    { title: 'Address', dataIndex: 'address' },
];
