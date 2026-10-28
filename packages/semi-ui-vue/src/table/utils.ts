import { Text, type VNode, type VNodeChild } from 'vue';
import { isEqualWith } from 'es-toolkit';
import { assignColumnKeys, placeInnerColumns } from '@fibrae/semi-foundation/table/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import elementType from '../_base/element-type';
import { nativeTag } from '../_base/native-tag';
import { childSlots, normalizeVNodeProps, toVNodes, type RawSlots } from '../_base/read-vnode';
import slotNodes, { isSlotContent, type KeyedNode } from '../_base/slot-nodes';
import type { MergedTableComponents } from './context';
import type { ColumnProps, TableComponent, TableComponents } from './interface';

/*
 * A string `:is` looks up registered components first, so a globally registered Table or Col would replace the table
 * and col elements; those parts render through nativeTag. Known limit: the per-row and per-cell parts (tbody, thead,
 * tr, td, th) stay strings, since no exported component shares their names and the wrapper measured about 2.4 times
 * slower to mount and 3 times slower to update; wrap them too once an export takes one of those names.
 */
const native = (component: TableComponent) => (typeof component === 'string' ? nativeTag(component) : component);

// Not a deep merge: it would copy component objects and remount them on every merge
export function mergeComponents(components: TableComponents | undefined, virtualized: boolean): MergedTableComponents {
    const defaults = virtualized ? { outer: 'div', wrapper: 'div', row: 'div', cell: 'div', colgroup: { wrapper: 'div', col: 'div' } } : { outer: 'table', wrapper: 'tbody', row: 'tr', cell: 'td', colgroup: { wrapper: 'colgroup', col: 'col' } };
    const header = { outer: 'table', wrapper: 'thead', row: 'tr', cell: 'th', ...components?.header };
    const body = { ...defaults, ...components?.body };
    const colgroup = { ...defaults.colgroup, ...components?.body?.colgroup };
    return {
        header: { ...header, outer: native(header.outer) },
        body: { ...body, outer: native(body.outer), colgroup: { wrapper: native(colgroup.wrapper), col: native(colgroup.col) } },
    };
}

/**
 * The slot output as keyed nodes, or null when it renders nothing so the caller shows its default
 */
export function slotOutput(slot?: (...args: any[]) => VNodeChild, ...args: unknown[]): KeyedNode[] | null {
    if (!slot) {
        return null;
    }
    const nodes = slotNodes(toVNodes(slot(...args)));
    return nodes.some(isSlotContent) ? nodes : null;
}

/** Resolves a template ref to an element or a component's root element */
export function toElement(target: unknown) {
    if (target instanceof HTMLElement) {
        return target;
    }
    const el = (target as { $el?: unknown } | null)?.$el;
    return el instanceof HTMLElement ? el : null;
}

const booleanKeys = new Set(['fixed', 'ellipsis', 'sorter', 'useFullRender', 'resize', 'showSortTip', 'filterMultiple', 'filterDropdown', 'sortChildrenRecord', 'filterChildrenRecord', 'filterDropdownVisible']);

export interface CollectedColumns {
    columns: ColumnProps[];
    /** Slots of each `Table.Column` child */
    slots: Map<ColumnProps, RawSlots>;
}

function readColumns(nodes: VNode[], slots: Map<ColumnProps, RawSlots>) {
    const columns: ColumnProps[] = [];
    for (const [node] of slotNodes(nodes)) {
        if (elementType(node) !== 'Table.Column') {
            warning(node.type !== Text || String(node.children).trim() !== '', '[Semi Table] Only Table.Column is allowed as a child of Table');
            continue;
        }
        // normalizeVNodeProps keeps data-* as attributes; here `data-index` is the template spelling of dataIndex
        const { 'data-index': kebabDataIndex, ...props } = normalizeVNodeProps(node.props, booleanKeys);
        const column = props as ColumnProps;
        if (kebabDataIndex !== undefined) {
            column.dataIndex = kebabDataIndex as string;
        }
        // Compiler-generated numeric keys repeat across siblings; only an authored string key names a column
        if (typeof node.key === 'string') {
            column.key = node.key;
        }
        const own: RawSlots = {};
        for (const [name, slot] of Object.entries(childSlots(node))) {
            // template slots carry `_` and h() slots `_ctx` beside the slot functions
            if (!name.startsWith('_') && typeof slot === 'function') {
                own[name] = slot;
            }
        }
        const { default: childrenSlot, ...columnSlots } = own;
        if (columnSlots.filterDropdown) {
            column.filterDropdown = true;
        }
        if (childrenSlot) {
            const children = readColumns(toVNodes(childrenSlot()), slots);
            if (children.length) {
                column.children = children;
            }
        }
        slots.set(column, columnSlots);
        columns.push(column);
    }
    return columns;
}

// Functions compare equal: slot closures are new on every parent render
const sameColumns = (a: ColumnProps[], b: ColumnProps[]) => isEqualWith(a, b, (x, y) => (typeof x === 'function' && typeof y === 'function' ? true : undefined));

function remapSlots(prev: ColumnProps[], next: ColumnProps[], nextSlots: Map<ColumnProps, RawSlots>, out: Map<ColumnProps, RawSlots>) {
    prev.forEach((column, index) => {
        const match = next[index];
        out.set(column, nextSlots.get(match) ?? {});
        if (column.children && match.children) {
            remapSlots(column.children, match.children, nextSlots, out);
        }
    });
}

/**
 * Equal column data keeps the previous array so the foundation sees no change; slots are always the latest.
 */
export function collectColumns(nodes: VNode[], prev?: CollectedColumns): CollectedColumns {
    const slots = new Map<ColumnProps, RawSlots>();
    const columns = readColumns(nodes, slots);
    if (!prev || !sameColumns(prev.columns, columns)) {
        return { columns, slots };
    }
    const kept = new Map<ColumnProps, RawSlots>();
    remapSlots(prev.columns, columns, slots, kept);
    return { columns: prev.columns, slots: kept };
}

/**
 * Copies the columns, adds selection and expand columns and assigns keys; `origins` maps each copy to its source.
 */
export function buildColumns(columns: ColumnProps[], innerColumns: (ColumnProps | null)[], origins: WeakMap<ColumnProps, ColumnProps>) {
    const copy = (list: ColumnProps[]) =>
        list.map((column) => {
            const next: ColumnProps = { ...column };
            origins.set(next, column);
            if (Array.isArray(column.children) && column.children.length) {
                next.children = copy(column.children);
            }
            return next;
        });
    return assignColumnKeys(placeInnerColumns(copy(columns), innerColumns)) as ColumnProps[];
}
