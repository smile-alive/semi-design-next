/**
 * Logic shared by the Tree and TreeSelect foundations. Apart from `loadTreeNode`, which drives a load through the
 * foundation it is given, these are pure: they take props and state and return results, and notifying callbacks and
 * writing state stay in each foundation. Only types come from ./foundation, so TreeSelect does not bundle the Tree
 * foundation.
 */
import { difference, isEqual, pick } from 'es-toolkit';
import { getListTargetIndex, type Typeahead } from '../../utils/a11y';
import { cssClasses } from './constants';
import type { BasicFlattenNode, BasicKeyEntities, BasicKeyEntity, BasicTreeInnerData, BasicTreeNodeData, BasicTreeNodeProps, BasicTreeProps, TreeMotionType } from './foundation';
import {
    calcCheckedKeys,
    calcCheckedKeysForChecked,
    calcCheckedKeysForUnchecked,
    calcDisabledKeys,
    calcExpandedKeys,
    calcExpandedKeysForValues,
    calcMotionKeys,
    convertDataToEntities,
    convertJsonToData,
    filterTreeData,
    findAncestorKeys,
    findDescendantKeys,
    findKeysForValues,
    flattenTreeData,
    getFilterProp,
    getValueOrKey,
    matchTreeNode,
    normalizeKeyList,
    normalizeValue,
    type KeyMapProps,
} from './tree-util';

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

/** `fullLabel` is whether a custom full label renders the row */
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
export function getTransitionNodes<T extends { key?: string }>(nodes: T[], motionKeys: Set<string>, motionType?: TreeMotionType | null, flattenList?: T[]) {
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
 * The data of the node with `key`. A key missing from treeData gets a placeholder node, or under onChangeWithObject
 * the matching object of `value`/`defaultValue`, undefined when none matches. The key check keeps an inherited
 * property name (`constructor`) from passing for a node.
 */
export function getNodeData(key: string, keyEntities: BasicKeyEntities, props: Parameters<typeof getDataForKeyNotInKeyEntities>[1]): BasicTreeNodeData | undefined {
    return keyEntities[key] && keyEntities[key].key === key ? keyEntities[key].data : getDataForKeyNotInKeyEntities(key, props);
}

/** The nodes and values onChange reports for checked keys, merged as leafOnly and autoMergeValue ask under checkRelation="related" */
export function getMultipleChange(keys: string[], props: Pick<BasicTreeProps, 'leafOnly' | 'checkRelation' | 'keyMaps' | 'autoMergeValue'> & Parameters<typeof getNodeData>[2], keyEntities: BasicKeyEntities) {
    const { leafOnly, checkRelation, keyMaps, autoMergeValue } = props;
    let keyList: string[] = [];
    if (checkRelation === 'related') {
        // leafOnly takes precedence over autoMergeValue={false}
        keyList = autoMergeValue || leafOnly ? normalizeKeyList(keys, keyEntities, leafOnly, true) : keys;
    } else if (checkRelation === 'unRelated') {
        keyList = keys;
    }
    const nodes = keyList.map((key) => getNodeData(key, keyEntities, props));
    return { nodes, value: getValueOrKey(nodes, keyMaps) };
}

/** The state of an empty selection in every mode, also what a value cleared back to undefined leaves */
export function getClearedSelection(): Pick<BasicTreeInnerData, 'selectedKeys' | 'checkedKeys' | 'halfCheckedKeys' | 'realCheckedKeys'> {
    return { selectedKeys: [], checkedKeys: new Set(), halfCheckedKeys: new Set(), realCheckedKeys: new Set() };
}

/** The checked state of the keys a multiple value resolves to; empty when checkRelation is neither 'related' nor 'unRelated' */
export function getCheckedState(keys: string[], checkRelation: BasicTreeProps['checkRelation'], keyEntities: BasicKeyEntities): Partial<Pick<BasicTreeInnerData, 'checkedKeys' | 'halfCheckedKeys' | 'realCheckedKeys'>> {
    if (checkRelation === 'unRelated') {
        return { realCheckedKeys: new Set(keys) };
    }
    if (checkRelation === 'related') {
        const { checkedKeys, halfCheckedKeys } = calcCheckedKeys(keys, keyEntities);
        return { checkedKeys, halfCheckedKeys };
    }
    return {};
}

/**
 * What a search keyword leaves on screen: the matches, their ancestors expanded, and under showFilteredOnly only
 * them and their descendants. An empty keyword expands the ancestors of the selection, unless expandedKeys is
 * controlled. `filteredNodes` is the data of the matches.
 */
export function getSearchState(
    searchValue: string,
    { showFilteredOnly, filterTreeNode, treeNodeFilterProp, keyMaps, expandedKeys: expandedKeysProp }: Pick<BasicTreeProps, 'showFilteredOnly' | 'filterTreeNode' | 'treeNodeFilterProp' | 'keyMaps' | 'expandedKeys'>,
    { expandedKeys: prevExpandedKeys, selectedKeys, keyEntities, treeData }: Pick<BasicTreeInnerData, 'expandedKeys' | 'selectedKeys' | 'keyEntities' | 'treeData'>
) {
    const expandedKeys = new Set(prevExpandedKeys);
    let filteredOpts: BasicKeyEntity[] = [];
    let expandedOptsKeys: string[] = [];
    let flattenNodes: BasicFlattenNode[];
    let filteredShownKeys = new Set<string>();
    if (!searchValue) {
        if (expandedKeysProp === undefined) {
            expandedOptsKeys = findAncestorKeys(selectedKeys, keyEntities, false);
            expandedOptsKeys.forEach((item) => expandedKeys.add(item));
        }
        flattenNodes = flattenTreeData(treeData, expandedKeys, keyMaps);
    } else {
        const realFilterProp = getFilterProp(treeNodeFilterProp, keyMaps);
        filteredOpts = Object.values(keyEntities).filter(({ data }) => matchTreeNode(searchValue, data, filterTreeNode, realFilterProp));
        const filteredOptsKeys = filteredOpts.map(({ key }) => key);
        expandedOptsKeys = findAncestorKeys(filteredOptsKeys, keyEntities, false);
        filteredShownKeys = new Set([...findDescendantKeys(filteredOptsKeys, keyEntities, true), ...expandedOptsKeys]);
        flattenNodes = flattenTreeData(treeData, new Set(expandedOptsKeys), keyMaps, showFilteredOnly && filteredShownKeys);
    }
    return {
        filteredNodes: filteredOpts.map(({ data }) => data),
        state: {
            expandedKeys,
            flattenNodes,
            motionKeys: new Set<string>(),
            filteredKeys: new Set(filteredOpts.map(({ key }) => key)),
            filteredExpandedKeys: new Set(expandedOptsKeys),
            filteredShownKeys,
        },
    };
}

/** The foundation `loadTreeNode` loads through: Tree or TreeSelect */
interface TreeLoadHost {
    getProps(): { loadData?: (data?: BasicTreeNodeData) => Promise<void>; loadedKeys?: string[] };
    getState(key: 'loadedKeys' | 'loadingKeys'): Set<string>;
    setState(state: Partial<Pick<BasicTreeInnerData, 'loadedKeys' | 'loadingKeys'>>): void;
}

/**
 * Loads a node's children once through `loadData`; `key` is the node's entity key, which keyMaps may take from
 * another field. A rejection clears the loading state, so the node can be retried, and still reaches the caller.
 */
export function loadTreeNode(host: TreeLoadHost, key: string, data: BasicTreeNodeData, notifyLoad: (loadedKeys: Set<string>, data: BasicTreeNodeData) => void) {
    const { loadData } = host.getProps();
    const loadingKeys = host.getState('loadingKeys');
    if (!loadData || host.getState('loadedKeys').has(key) || loadingKeys.has(key)) {
        return;
    }
    void loadData(data)
        .then(() => {
            const newLoadedKeys = new Set(host.getState('loadedKeys')).add(key);
            const newLoadingKeys = new Set(host.getState('loadingKeys'));
            newLoadingKeys.delete(key);
            // before the state is written, or loadData triggers twice
            notifyLoad(newLoadedKeys, data);
            if (host.getProps().loadedKeys === undefined) {
                host.setState({ loadedKeys: newLoadedKeys });
            }
            host.setState({ loadingKeys: newLoadingKeys });
        })
        .finally(() => {
            const currentLoadingKeys = host.getState('loadingKeys');
            if (currentLoadingKeys.has(key)) {
                const newLoadingKeys = new Set(currentLoadingKeys);
                newLoadingKeys.delete(key);
                host.setState({ loadingKeys: newLoadingKeys });
            }
        });
    host.setState({ loadingKeys: new Set(loadingKeys).add(key) });
}

/**
 * deriveState for a controlled expandedKeys, or an autoExpandParent change: the expanded keys, and when one row opens
 * or closes without a treeData change, the rows that animate
 */
export function deriveExpandedKeys(
    props: Pick<BasicTreeProps, 'expandedKeys' | 'autoExpandParent' | 'motion'>,
    prevState: Pick<BasicTreeInnerData, 'expandedKeys' | 'flattenNodes'> & { prevProps: object | null },
    keyEntities: BasicKeyEntities,
    treeDataChanged: boolean
): Partial<Pick<BasicTreeInnerData, 'expandedKeys' | 'motionKeys' | 'motionType' | 'cachedFlattenNodes'>> {
    const { prevProps } = prevState;
    const expandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
    if (!prevProps || !props.motion || treeDataChanged) {
        return { expandedKeys };
    }
    const { motionKeys, motionType } = calcMotionKeys(prevState.expandedKeys, expandedKeys, keyEntities);
    const newState: ReturnType<typeof deriveExpandedKeys> = { expandedKeys, motionKeys: new Set(motionKeys), motionType };
    if (motionType === 'hide') {
        // keeps collapsing rows rendered; a controlled change may not come from interaction
        newState.cachedFlattenNodes = prevState.flattenNodes;
    }
    return newState;
}

/**
 * deriveState while a search is on: new treeData is filtered again, and a controlled expandedKeys expands within the
 * result. `treeData` is set only when its reference changed, `structureChanged` only when its rows did, which alone
 * stops animations; `keyEntities` are the current ones. `prevFilteredKeys` holds the matches of the previous pass over
 * the same structure, whose ancestors stay as the user left them.
 */
export function deriveSearchingState(
    props: Pick<BasicTreeProps, 'filterTreeNode' | 'treeNodeFilterProp' | 'showFilteredOnly' | 'keyMaps' | 'expandedKeys' | 'autoExpandParent' | 'motion'>,
    prevState: Pick<BasicTreeInnerData, 'inputValue' | 'treeData' | 'flattenNodes' | 'filteredExpandedKeys' | 'filteredShownKeys'> & { prevProps: Pick<BasicTreeProps, 'showFilteredOnly'> | null },
    { treeData, structureChanged, keyEntities, prevFilteredKeys }: { treeData?: BasicTreeNodeData[]; structureChanged: boolean; keyEntities: BasicKeyEntities; prevFilteredKeys?: Set<string> }
) {
    const { prevProps } = prevState;
    const { keyMaps } = props;
    const newState: Partial<BasicTreeInnerData> = {};
    if (treeData) {
        const filteredState = filterTreeData({
            treeData,
            inputValue: prevState.inputValue,
            filterTreeNode: props.filterTreeNode,
            filterProps: getFilterProp(props.treeNodeFilterProp, keyMaps),
            showFilteredOnly: props.showFilteredOnly,
            keyEntities,
            prevExpandedKeys: [...prevState.filteredExpandedKeys],
            prevFilteredKeys,
            keyMaps,
        });
        newState.flattenNodes = filteredState.flattenNodes;
        if (structureChanged) {
            newState.motionKeys = new Set([]);
        }
        newState.filteredKeys = filteredState.filteredKeys;
        newState.filteredShownKeys = filteredState.filteredShownKeys;
        newState.filteredExpandedKeys = filteredState.filteredExpandedKeys;
    }
    if (props.expandedKeys) {
        const filteredExpandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
        const unchanged = prevProps && !treeData && prevProps.showFilteredOnly === props.showFilteredOnly && filteredExpandedKeys.size === prevState.filteredExpandedKeys.size && [...filteredExpandedKeys].every((key) => prevState.filteredExpandedKeys.has(key));
        if (!unchanged) {
            newState.filteredExpandedKeys = filteredExpandedKeys;
            if (prevProps && props.motion && !structureChanged) {
                const motionResult = calcMotionKeys(prevState.filteredExpandedKeys, filteredExpandedKeys, keyEntities);
                let { motionKeys } = motionResult;
                const { motionType } = motionResult;
                if (props.showFilteredOnly) {
                    motionKeys = motionKeys.filter((key) => prevState.filteredShownKeys.has(key));
                }
                if (motionType === 'hide') {
                    newState.cachedFlattenNodes = prevState.flattenNodes;
                }
                newState.motionKeys = new Set(motionKeys);
                newState.motionType = motionType;
            }
            newState.flattenNodes = flattenTreeData(treeData || prevState.treeData, filteredExpandedKeys, keyMaps, props.showFilteredOnly && (newState.filteredShownKeys ?? prevState.filteredShownKeys));
        }
    }
    return newState;
}

/** Compares key/value/children only: a label that is a ReactNode is a new object on every render */
function isTreeDataStructureEqual(prevTreeData: any[], nextTreeData: any[], keyMaps?: KeyMapProps) {
    if (prevTreeData === nextTreeData) {
        return true;
    }
    if (!prevTreeData || !nextTreeData) {
        return false;
    }
    const realKeyName = keyMaps?.key ?? 'key';
    const realValueName = keyMaps?.value ?? 'value';
    const realChildrenName = keyMaps?.children ?? 'children';
    const compareNodes = (nodesA: any[], nodesB: any[]): boolean =>
        nodesA.length === nodesB.length &&
        nodesA.every((nodeA, i) => {
            const nodeB = nodesB[i];
            return nodeA[realKeyName] === nodeB[realKeyName] && nodeA[realValueName] === nodeB[realValueName] && compareNodes(nodeA[realChildrenName] || [], nodeB[realChildrenName] || []);
        });
    return compareNodes(prevTreeData, nextTreeData);
}

/**
 * The uncontrolled selection across a treeData change. A key the previous treeData did not have is a defaultValue
 * placeholder that holds the value, so it becomes the key of the node with that value once such a node arrives
 */
function keepUncontrolledKeys(keys: Iterable<string>, prevKeyEntities: BasicKeyEntities, keyEntities: BasicKeyEntities, valueEntities: Record<string, string>) {
    return [...keys].flatMap((key) => {
        if (!(key in prevKeyEntities)) {
            return [valueEntities[key] ?? key];
        }
        return key in keyEntities ? [key] : [];
    });
}

type DerivedTreeStateKey = Exclude<keyof BasicTreeInnerData, 'prevProps' | 'dragging' | 'dragNodesKeys' | 'dragOverNodeKey' | 'dropPosition'>;

/** The props deriveTreeState reads; `remote` is TreeSelect's, whose search the user runs, so the tree is never filtered */
export type DeriveTreeProps = Pick<
    BasicTreeProps,
    | 'autoExpandParent'
    | 'checkRelation'
    | 'defaultExpandAll'
    | 'defaultExpandedKeys'
    | 'defaultValue'
    | 'disableStrictly'
    | 'expandAll'
    | 'expandedKeys'
    | 'filterTreeNode'
    | 'keyMaps'
    | 'loadedKeys'
    | 'motion'
    | 'multiple'
    | 'onChangeWithObject'
    | 'showFilteredOnly'
    | 'treeData'
    | 'treeDataSimpleJson'
    | 'treeNodeFilterProp'
    | 'value'
> & { remote?: boolean };

/**
 * The state that props imply for Tree and TreeSelect, given the previous state (modeled on rc-tree's
 * getDerivedStateFromProps, https://github.com/react-component/tree). `prevState.prevProps` holds the props of the
 * last derivation, and the result keeps the `propKeys` of these props as the next one. Returns null when nothing
 * changed, so a host that writes the result back settles.
 */
export function deriveTreeState(props: DeriveTreeProps, prevState: Pick<BasicTreeInnerData, DerivedTreeStateKey> & { prevProps: DeriveTreeProps | null }, propKeys: readonly (keyof DeriveTreeProps)[]): (Partial<Pick<BasicTreeInnerData, DerivedTreeStateKey>> & { prevProps?: DeriveTreeProps }) | null {
    const { prevProps } = prevState;
    const { keyMaps, onChangeWithObject: withObject, multiple: isMultiple } = props;
    let treeData: BasicTreeNodeData[];
    let keyEntities = prevState.keyEntities ?? {};
    let valueEntities = prevState.cachedKeyValuePairs ?? {};
    const isSearching = Boolean(props.filterTreeNode && !props.remote && prevState.inputValue);
    const newState: ReturnType<typeof deriveTreeState> = {};

    const needUpdate = (name: keyof DeriveTreeProps) => (prevProps ? !isEqual(prevProps[name], props[name]) : props[name] !== undefined);
    const findKeys = (value: BasicTreeProps['value']) => findKeysForValues(normalizeValue(value, withObject, keyMaps), valueEntities, isMultiple);
    const expandedKeysFor = (value: BasicTreeProps['value']) => calcExpandedKeysForValues(normalizeValue(value, withObject, keyMaps), keyEntities, isMultiple, valueEntities);

    const needUpdateSimpleJson = needUpdate('treeDataSimpleJson');
    // a new reference rebuilds entities (label/icon/disabled may change); only a structural change resets expansion
    const treeDataRefUpdated = prevProps ? prevProps.treeData !== props.treeData : props.treeData !== undefined;
    const treeDataStructureUpdated = prevProps ? !isTreeDataStructureEqual(prevProps.treeData, props.treeData, keyMaps) : props.treeData !== undefined;

    if (treeDataRefUpdated || needUpdateSimpleJson) {
        treeData = treeDataRefUpdated ? props.treeData : convertJsonToData(props.treeDataSimpleJson);
        newState.treeData = treeData;
        const entitiesMap = convertDataToEntities(treeData, keyMaps);
        newState.keyEntities = { ...entitiesMap.keyEntities };
        keyEntities = newState.keyEntities;
        newState.cachedKeyValuePairs = { ...entitiesMap.valueEntities };
        valueEntities = newState.cachedKeyValuePairs;
    }

    const dataUpdated = needUpdateSimpleJson || treeDataStructureUpdated;
    if (dataUpdated && props.motion && prevProps) {
        newState.motionKeys = new Set([]);
        newState.motionType = null;
    }
    if (!isSearching) {
        if (needUpdate('expandedKeys') || (prevProps && needUpdate('autoExpandParent'))) {
            Object.assign(newState, deriveExpandedKeys(props, prevState, keyEntities, dataUpdated));
        } else if ((!prevProps && (props.defaultExpandAll || props.expandAll)) || (dataUpdated && props.expandAll)) {
            newState.expandedKeys = new Set(Object.keys(keyEntities));
        } else if (!prevProps && props.defaultExpandedKeys) {
            newState.expandedKeys = calcExpandedKeys(props.defaultExpandedKeys, keyEntities);
        } else if (!prevProps && props.defaultValue !== undefined) {
            newState.expandedKeys = expandedKeysFor(props.defaultValue);
        } else if (!prevProps && props.value !== undefined) {
            newState.expandedKeys = expandedKeysFor(props.value);
        }

        if (treeData || newState.expandedKeys) {
            newState.flattenNodes = flattenTreeData(treeData || prevState.treeData, newState.expandedKeys || prevState.expandedKeys, keyMaps);
        }
    } else {
        // the same structure under a new reference keeps the ancestors as the user left them during the search
        Object.assign(newState, deriveSearchingState(props, prevState, { treeData, structureChanged: dataUpdated, keyEntities, prevFilteredKeys: dataUpdated ? undefined : prevState.filteredKeys }));
    }

    let selectedKeys: string[] | undefined;
    if (needUpdate('value')) {
        selectedKeys = findKeys(props.value);
    } else if (!prevProps && props.defaultValue !== undefined) {
        selectedKeys = findKeys(props.defaultValue);
    } else if (treeData) {
        const prevKeys = !isMultiple ? prevState.selectedKeys : props.checkRelation === 'related' ? prevState.checkedKeys : prevState.realCheckedKeys;
        selectedKeys = props.value !== undefined ? findKeys(props.value) : keepUncontrolledKeys(prevKeys, prevState.keyEntities, keyEntities, valueEntities);
    }
    if (selectedKeys && !isMultiple) {
        newState.selectedKeys = selectedKeys;
    } else if (selectedKeys) {
        Object.assign(newState, getCheckedState(selectedKeys, props.checkRelation, keyEntities));
    }

    if (needUpdate('loadedKeys')) {
        newState.loadedKeys = new Set(props.loadedKeys);
    }

    if (treeData && props.disableStrictly && props.checkRelation === 'related') {
        newState.disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
    }

    // a changed compared prop must still move prevProps, or a later render sees it as new
    const comparedPropChanged = (['expandedKeys', 'autoExpandParent', 'value', 'showFilteredOnly'] as const).some(needUpdate);
    if (prevProps && Object.keys(newState).length === 0 && !comparedPropChanged) {
        return null;
    }
    // a snapshot: a host may pass the same live props object every time
    newState.prevProps = pick(props, propKeys);
    return newState;
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
