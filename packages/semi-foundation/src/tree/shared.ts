/**
 * Pure functions shared by the Tree and TreeSelect foundations. They take props and state and return results;
 * notifying callbacks and writing state stay in each foundation. Only types come from ./foundation, so TreeSelect
 * does not bundle the Tree foundation.
 */
import { difference, pick } from 'es-toolkit';
import { getListTargetIndex, type Typeahead } from '../utils/a11y';
import { cssClasses } from './constants';
import type { BasicFlattenNode, BasicKeyEntities, BasicKeyEntity, BasicTreeInnerData, BasicTreeNodeProps, BasicTreeProps, TreeMotionType } from './foundation';
import { calcCheckedKeys, calcCheckedKeysForChecked, calcCheckedKeysForUnchecked, findDescendantKeys, normalizeKeyList } from './tree-util';

type CheckState = Pick<BasicTreeInnerData, 'keyEntities' | 'checkedKeys' | 'halfCheckedKeys' | 'disabledKeys'>;

type ShownSiblings = Map<BasicKeyEntity, number>;
// Every row of a render asks for its siblings: computing them per row costs O(rows × nodes) for root rows, so each
// parent's shown siblings are computed once per data and search result
const shownSiblingsCache = new WeakMap<BasicKeyEntities, WeakMap<Set<string>, Map<BasicKeyEntity | undefined, ShownSiblings>>>();

/** The siblings of an entity that a showFilteredOnly search leaves on screen, mapped to their 1-based position */
function getShownSiblings(entity: BasicKeyEntity, keyEntities: BasicKeyEntities, filteredShownKeys: Set<string>) {
    let byShownKeys = shownSiblingsCache.get(keyEntities);
    if (!byShownKeys) {
        byShownKeys = new WeakMap();
        shownSiblingsCache.set(keyEntities, byShownKeys);
    }
    let byParent = byShownKeys.get(filteredShownKeys);
    if (!byParent) {
        byParent = new Map();
        byShownKeys.set(filteredShownKeys, byParent);
    }
    let shown = byParent.get(entity.parent);
    if (!shown) {
        const siblings = entity.parent ? entity.parent.children : Object.values(keyEntities).filter((e) => !e.parent);
        shown = new Map(siblings.filter((e) => filteredShownKeys.has(e.key)).map((e, i) => [e, i + 1]));
        byParent.set(entity.parent, shown);
    }
    return shown;
}

/** The props a tree node renders with */
export function getTreeNodeProps(
    key: string,
    {
        expandedKeys = new Set([]),
        selectedKeys = [],
        checkedKeys = new Set([]),
        halfCheckedKeys = new Set([]),
        realCheckedKeys = new Set([]),
        keyEntities = {},
        filteredKeys = new Set([]),
        inputValue = '',
        loadedKeys = new Set([]),
        loadingKeys = new Set([]),
        filteredExpandedKeys = new Set([]),
        filteredShownKeys = new Set([]),
        disabledKeys = new Set([]),
        treeData = [],
    }: Partial<Omit<BasicTreeInnerData, 'prevProps'>>,
    props: Pick<BasicTreeProps, 'checkRelation' | 'disableStrictly' | 'showFilteredOnly'>
): BasicTreeNodeProps | null {
    const { checkRelation } = props;
    const entity = keyEntities[key];
    if (!entity) {
        return null;
    }
    let realChecked = false;
    let realHalfChecked = false;
    if (checkRelation === 'related') {
        realChecked = checkedKeys.has(key);
        realHalfChecked = halfCheckedKeys.has(key);
    } else if (checkRelation === 'unRelated') {
        realChecked = realCheckedKeys.has(key);
    }
    const isSearching = Boolean(inputValue);
    // aria-setsize/aria-posinset count only the siblings on screen when a search hides the others
    let setsize = entity.parent ? entity.parent.children.length : treeData.length;
    let posinset = entity.ind + 1;
    if (isSearching && props.showFilteredOnly) {
        const shown = getShownSiblings(entity, keyEntities, filteredShownKeys);
        setsize = shown.size;
        posinset = shown.get(entity) ?? 0;
    }
    const treeNodeProps: BasicTreeNodeProps = {
        eventKey: key,
        expanded: isSearching ? filteredExpandedKeys.has(key) : expandedKeys.has(key),
        selected: selectedKeys.includes(key),
        checked: realChecked,
        halfChecked: realHalfChecked,
        pos: String(entity.pos),
        level: entity.level,
        setsize,
        posinset,
        filtered: filteredKeys.has(key),
        loading: loadingKeys.has(key) && !loadedKeys.has(key),
        loaded: loadedKeys.has(key),
        keyword: inputValue,
    };
    if (props.disableStrictly && disabledKeys.has(key)) {
        treeNodeProps.disabled = true;
    }
    return treeNodeProps;
}

/** Whether a node renders as a leaf, with no expand arrow; with loadData a node is a branch until it loads empty */
export function isTreeNodeLeaf({ isLeaf, children, loaded }: Pick<BasicTreeNodeProps, 'isLeaf' | 'children' | 'loaded'>, loadData: unknown) {
    if (isLeaf === false) {
        return false;
    }
    const hasChildren = Boolean(children?.length);
    return Boolean(isLeaf || (!loadData && !hasChildren) || (loadData && loaded && !hasChildren));
}

/**
 * The props a row renders with, also what the foundation's handlers read: the node's data, then the flattened fields
 * (which follow keyMaps), then its state from the foundation, which wins over data fields of the same name
 * (expanded, checked, level...). Null when the key is not in the tree.
 */
export function buildRowProps(node: BasicFlattenNode, state: Partial<Omit<BasicTreeInnerData, 'prevProps'>>, props: Pick<BasicTreeProps, 'checkRelation' | 'disableStrictly' | 'showFilteredOnly' | 'keyMaps'>): BasicTreeNodeProps | null {
    const { data = {}, key } = node;
    const nodeProps = getTreeNodeProps(key, state, props);
    if (!nodeProps) {
        return null;
    }
    // children follows keyMaps, so a data field named children never makes a leaf a branch
    return {
        ...data,
        ...pick(node, ['key', 'label', 'disabled', 'isLeaf', 'icon', 'isEnd']),
        ...nodeProps,
        children: data[props.keyMaps?.children ?? 'children'],
        data,
    };
}

/** Row ids are IDREFs for aria-activedescendant, so a key with spaces is encoded */
export function nodeId(baseId: string, key: string) {
    return `${baseId}-${encodeURIComponent(key)}`;
}

export interface TreeRowAria {
    'aria-busy'?: true;
    'aria-checked'?: boolean | 'mixed';
    'aria-disabled': boolean;
    'aria-expanded'?: boolean;
    'aria-level': number;
    'aria-posinset': number;
    'aria-selected'?: boolean;
    'aria-setsize': number;
}

/** The treeitem attributes of a row: a multiple tree states each row's check, a single one its selection */
export function getTreeRowAria(row: BasicTreeNodeProps, { disabled, isLeaf, multiple }: { disabled: boolean; isLeaf: boolean; multiple?: boolean }): TreeRowAria {
    return {
        'aria-busy': row.loading || undefined,
        'aria-checked': multiple ? (row.halfChecked ? 'mixed' : Boolean(row.checked)) : undefined,
        'aria-disabled': disabled,
        'aria-expanded': isLeaf ? undefined : Boolean(row.expanded),
        'aria-level': row.level + 1,
        'aria-posinset': row.posinset,
        'aria-selected': multiple ? undefined : Boolean(row.selected),
        'aria-setsize': row.setsize,
    };
}

/** What a row's classes depend on besides its own state; `fullLabel` is whether a custom full label renders it */
export interface TreeRowFlags {
    disabled: boolean;
    focused?: boolean;
    draggable?: boolean;
    labelEllipsis?: boolean;
    fullLabel?: boolean;
    dragOverNodeKey?: string | null;
    dropPosition?: number | null;
}

function getRowDrop(row: BasicTreeNodeProps, { disabled, dragOverNodeKey, dropPosition }: TreeRowFlags) {
    const over = dragOverNodeKey === row.eventKey && !disabled;
    return { over: over && dropPosition === 0, top: over && dropPosition === -1, bottom: over && dropPosition === 1 };
}

/** The classes of a row element, also what a custom full label gets to put on its own */
export function getTreeRowClassMap(row: BasicTreeNodeProps, flags: TreeRowFlags): Record<string, boolean | undefined> {
    const prefix = cssClasses.PREFIX_OPTION;
    const { disabled, draggable, fullLabel } = flags;
    const drop = getRowDrop(row, flags);
    return {
        [prefix]: true,
        [`${prefix}-level-${row.level + 1}`]: true,
        [`${prefix}-fullLabel-level-${row.level + 1}`]: fullLabel,
        [`${prefix}-collapsed`]: !row.expanded,
        [`${prefix}-disabled`]: disabled,
        [`${prefix}-selected`]: row.selected,
        [`${prefix}-focused`]: flags.focused,
        [`${prefix}-ellipsis`]: flags.labelEllipsis,
        [`${prefix}-drag-over`]: drop.over,
        [`${prefix}-draggable`]: !disabled && draggable && !fullLabel,
        [`${prefix}-fullLabel-draggable`]: !disabled && draggable && fullLabel,
        [`${prefix}-fullLabel-drag-over-gap-top`]: drop.top && fullLabel,
        [`${prefix}-fullLabel-drag-over-gap-bottom`]: drop.bottom && fullLabel,
        [`${prefix}-tree-node-last-leaf`]: row.isEnd.at(-1),
    };
}

/** The classes of the label of a row that the tree renders itself */
export function getTreeLabelClassMap(row: BasicTreeNodeProps, flags: TreeRowFlags): Record<string, boolean> {
    const prefix = cssClasses.PREFIX_OPTION;
    const drop = getRowDrop(row, flags);
    return { [`${prefix}-label`]: true, [`${prefix}-drag-over-gap-top`]: drop.top, [`${prefix}-drag-over-gap-bottom`]: drop.bottom };
}

export function sameKeys(a: { key?: string }[], b: { key?: string }[]) {
    return a.length === b.length && a.every((node, i) => node.key === b[i].key);
}

/**
 * The rows, with the ones that appear or disappear (motionKeys) in one array at the place of the first, for the
 * animated group; the array is there even when empty
 */
export function getTransitionNodes<T extends { key?: string }>(nodes: T[], motionKeys: Set<string>, motionType: TreeMotionType | null | undefined, flattenList?: T[]) {
    const transitionNodes: (T | T[])[] = [];
    const range: T[] = [];
    const firstKey = motionKeys.values().next().value;
    let rangeStart = 0;
    // collapsing rows are gone from nodes; they come from the list cached before the collapse
    const lookUp = motionType === 'hide' && flattenList ? flattenList : nodes;
    lookUp.forEach((node, index) => {
        if (motionKeys.has(node.key)) {
            range.push(node);
            if (node.key === firstKey) {
                rangeStart = index;
            }
        } else {
            transitionNodes.push(node);
        }
    });
    transitionNodes.splice(rangeStart, 0, range);
    return transitionNodes;
}

export type TreeKeyAction = { type: 'move'; index: number } | { type: 'expand' } | { type: 'collapse' };

/**
 * What a key does to the active row of a tree (APG tree view): Up and Down move between the visible rows, Home and
 * End go to the first and the last; Right opens a closed branch or moves into an open one, Left closes an open
 * branch or moves to the parent (Right and Left swap in RTL). Disabled rows stay reachable, because a disabled
 * branch can still be expanded. Returns null for other keys and when there is nowhere to go.
 */
export function getTreeKeyAction<T extends BasicFlattenNode>(key: string, index: number, rows: T[], { isExpanded, isLeaf, rtl }: { isExpanded: (row: T) => boolean; isLeaf: (row: T) => boolean; rtl: boolean }): TreeKeyAction | null {
    const [into, out] = rtl ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
    const row = rows[index];
    if (row && key === into) {
        if (isLeaf(row)) {
            return null;
        }
        if (!isExpanded(row)) {
            return { type: 'expand' };
        }
        // children may still be loading
        return rows[index + 1]?.parent?.key === row.key ? { type: 'move', index: index + 1 } : null;
    }
    if (row && key === out) {
        if (!isLeaf(row) && isExpanded(row)) {
            return { type: 'collapse' };
        }
        const parent = row.parent ? rows.findIndex((r) => r.key === row.parent.key) : -1;
        return parent === -1 ? null : { type: 'move', index: parent };
    }
    const target = getListTargetIndex(key, index, rows.length, () => false);
    return target === null ? null : { type: 'move', index: target };
}

export type TreeKeyboardAction =
    | TreeKeyAction
    | { type: 'select' }
    // the key was consumed (typeahead with no match, or an expand or collapse with no row props) but nothing changes
    | { type: 'none' };

/**
 * What a key event does in a tree, or null when the tree does not handle it. Besides the arrow keys of
 * `getTreeKeyAction`: Enter and Space select the active row, and a printable character moves to the next row whose
 * label starts with it. In a text field (a combobox's search input) only Up, Down and Enter act on the tree, the
 * other keys edit the text. `isRow` tells whether a row has render props to act on.
 */
export function getTreeKeyboardAction<T extends BasicFlattenNode>(
    event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean },
    rows: T[],
    activeIndex: number,
    editing: boolean,
    { isRow, isExpanded, isLeaf, rtl }: { isRow: (row: T) => boolean; isExpanded: (row: T) => boolean; isLeaf: (row: T) => boolean; rtl: boolean },
    typeahead: Typeahead
): TreeKeyboardAction | null {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return null;
    }
    if (!editing && typeahead.accepts(event)) {
        const labels = rows.map(({ label }) => (typeof label === 'string' || typeof label === 'number' ? String(label) : ''));
        const target = typeahead.match(event.key, labels, activeIndex);
        return target === -1 ? { type: 'none' } : { type: 'move', index: target };
    }
    const hasRow = rows[activeIndex] !== undefined && isRow(rows[activeIndex]);
    if (event.key === 'Enter' || (event.key === ' ' && !editing)) {
        return hasRow ? { type: 'select' } : null;
    }
    if (editing && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return null;
    }
    const action = getTreeKeyAction(event.key, activeIndex, rows, { isExpanded, isLeaf, rtl });
    if (action && action.type !== 'move' && !hasRow) {
        return { type: 'none' };
    }
    return action;
}

/**
 * The node for a selected key missing from treeData: found in the object value (onChangeWithObject), else built from
 * the key. The label goes under keyMaps.label, then TreeSelect's treeNodeLabelProp, then 'label'.
 */
export function getDataForKeyNotInKeyEntities(
    key: string,
    {
        onChangeWithObject,
        value,
        defaultValue,
        keyMaps,
        treeNodeLabelProp,
    }: Pick<BasicTreeProps, 'onChangeWithObject' | 'value' | 'defaultValue' | 'keyMaps'> & {
        treeNodeLabelProp?: string;
    }
) {
    const realKeyName = keyMaps?.key ?? 'key';
    if (!onChangeWithObject) {
        const labelName = keyMaps?.label ?? treeNodeLabelProp ?? 'label';
        return { [realKeyName]: key, [labelName]: key };
    }
    const realValueName = keyMaps?.value ?? 'value';
    let valueArr = [];
    if (value) {
        valueArr = Array.isArray(value) ? value : [value];
    } else if (defaultValue) {
        valueArr = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return valueArr.find((item) => item[realValueName] === key || item[realKeyName] === key);
}

/**
 * Under disableStrictly, the status a click on an unchecked node leads to: unchecked when every non-disabled
 * descendant is already checked, checked otherwise. Unchecking always unchecks.
 */
export function calcCheckedStatus(targetStatus: boolean, eventKey: string, { checkedKeys, keyEntities, disabledKeys }: Pick<CheckState, 'keyEntities' | 'checkedKeys' | 'disabledKeys'>) {
    if (!targetStatus) {
        return targetStatus;
    }
    const descendantKeys = normalizeKeyList(findDescendantKeys([eventKey], keyEntities, false), keyEntities, true);
    const hasDisabled = descendantKeys.some((key) => disabledKeys.has(key));
    if (!hasDisabled) {
        return targetStatus;
    }
    const nonDisabledKeys = descendantKeys.filter((key) => !disabledKeys.has(key));
    const allChecked = nonDisabledKeys.every((key) => checkedKeys.has(key));
    return !allChecked;
}

/**
 * The checked and half-checked keys after checking or unchecking a node with checkRelation="related"; under
 * disableStrictly, disabled descendants keep their status
 */
export function calcRelatedCheckedKeys(eventKey: string, targetStatus: boolean, disableStrictly: boolean, state: CheckState) {
    const { keyEntities, disabledKeys } = state;
    // copies: the treeUtil helpers mutate the sets
    const checkedKeys = new Set(state.checkedKeys);
    const halfCheckedKeys = new Set(state.halfCheckedKeys);
    const descendantKeys = disableStrictly ? normalizeKeyList(findDescendantKeys([eventKey], keyEntities, false), keyEntities, true) : [];
    const nonDisabled = descendantKeys.filter((key) => !disabledKeys.has(key));
    if (nonDisabled.length === descendantKeys.length) {
        return targetStatus ? calcCheckedKeysForChecked(eventKey, keyEntities, checkedKeys, halfCheckedKeys) : calcCheckedKeysForUnchecked(eventKey, keyEntities, checkedKeys, halfCheckedKeys);
    }
    const newCheckedKeys = targetStatus ? [...nonDisabled, ...checkedKeys] : difference(normalizeKeyList([...checkedKeys], keyEntities, true, true), nonDisabled);
    return calcCheckedKeys(newCheckedKeys, keyEntities);
}

/**
 * A click on a node in multiple mode: the status it gets, the keys to report through onChange and the state to write
 * when uncontrolled. Null when checkRelation is neither 'related' nor 'unRelated'.
 */
export function getMultipleSelectResult(
    { checked, eventKey }: BasicTreeNodeProps,
    { disableStrictly, checkRelation }: Pick<BasicTreeProps, 'disableStrictly' | 'checkRelation'>,
    state: CheckState & Pick<BasicTreeInnerData, 'realCheckedKeys'>
): {
    targetStatus: boolean;
    keys: string[];
    state: Partial<Pick<BasicTreeInnerData, 'checkedKeys' | 'halfCheckedKeys' | 'realCheckedKeys'>>;
} | null {
    if (checkRelation === 'related') {
        const targetStatus = disableStrictly ? calcCheckedStatus(!checked, eventKey, state) : !checked;
        const { checkedKeys, halfCheckedKeys } = calcRelatedCheckedKeys(eventKey, targetStatus, disableStrictly, state);
        return { targetStatus, keys: [...checkedKeys], state: { checkedKeys, halfCheckedKeys } };
    }
    if (checkRelation === 'unRelated') {
        const realCheckedKeys = new Set(state.realCheckedKeys);
        const targetStatus = !realCheckedKeys.has(eventKey);
        if (targetStatus) {
            realCheckedKeys.add(eventKey);
        } else {
            realCheckedKeys.delete(eventKey);
        }
        return { targetStatus, keys: [...realCheckedKeys], state: { realCheckedKeys } };
    }
    return null;
}
