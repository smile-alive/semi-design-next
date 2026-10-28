/**
 * The drag and drop handler implementation is referenced from rc-tree
 * https://github.com/react-component/tree
 */

import { isEqual, throttle } from 'es-toolkit';
// compat pick resolves deep paths (treeDataSimpleJson)
import { get, pick } from 'es-toolkit/compat';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from './constants';
import { getDataForKeyNotInKeyEntities, getMultipleSelectResult, isTreeNodeLeaf } from './shared';
import {
    flattenTreeData,
    findDescendantKeys,
    findAncestorKeys,
    matchTreeNode,
    normalizedArr,
    normalizeKeyList,
    getMotionKeys,
    calcCheckedKeys,
    getValueOrKey,
    getDragNodesKeys,
    calcDropRelativePosition,
    calcDropActualPosition,
    convertDataToEntities,
    convertJsonToData,
    calcExpandedKeys,
    calcExpandedKeysForValues,
    calcMotionKeys,
    findKeysForValues,
    normalizeValue,
    keepExistingKeys,
    calcDisabledKeys,
    filterTreeData,
    getFilterProp,
    type KeyMapProps,
} from './tree-util';
export type { KeyMapProps };

export interface BasicTreeNodeProps {
    [x: string]: any;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    halfChecked?: boolean;
    disabled?: boolean;
    loaded?: boolean;
    loading?: boolean;
    isLeaf?: boolean;
    pos?: string;
    children?: BasicTreeNodeData[];
    icon?: any;
    directory?: boolean;
    selectedKey?: string;
    motionKey?: string[] | string;
    eventKey?: string;
    showLine?: boolean;
    setsize?: number;
    posinset?: number;
}

export interface BasicTreeNodeData {
    [x: string]: any;
    key?: string;
    value?: number | string;
    label?: any;
    icon?: any;
    disabled?: boolean;
    isLeaf?: boolean;
    children?: BasicTreeNodeData[];
}

export interface BasicKeyEntities {
    [key: string]: BasicKeyEntity;
}

export interface BasicKeyEntity {
    children?: BasicKeyEntity[];
    data?: BasicTreeNodeData;
    ind?: number;
    key?: string;
    level?: number;
    parent?: BasicKeyEntity;
    parentPos?: null | string;
    pos?: string;
}

export interface BasicDragTreeNode extends BasicTreeNodeData {
    expanded: boolean;
    /**
     * The positional relationship of the current node in the entire
     * treeData, such as the 0th node of the 2nd node of the 1st node
     * of the 0th layer: '0-1-2-0'
     */
    pos: string;
}

export interface BasicFlattenNode {
    _innerDataTag?: boolean;
    children?: BasicFlattenNode[];
    data?: BasicTreeNodeData;
    disabled?: boolean;
    icon?: any;
    isEnd?: boolean[];
    isLeaf?: boolean;
    key?: string;
    label?: any;
    parent?: null | BasicFlattenNode;
    pos?: string;
    value?: string;
}

/** `show` while rows expand, `hide` while they collapse */
export type TreeMotionType = 'show' | 'hide';

/** The values and the `smart` rule are those of the adapter's virtual list */
export type ScrollAlign = 'center' | 'start' | 'end' | 'smart' | 'auto';

export interface BasicDragProps {
    event: any;
    node: BasicDragTreeNode;
}

export interface BasicDragEnterProps extends BasicDragProps {
    expandedKeys?: string[];
}

export type ExpandAction = false | 'click' | 'doubleClick';

export type BasicValue = string | number | BasicTreeNodeData | Array<BasicTreeNodeData | string | number>;

export interface BasicOnDragProps {
    event: any;
    node: BasicDragTreeNode;
    dragNode: BasicDragTreeNode;
    dragNodesKeys: string[];
    /**
     * dropPosition represents the position of the dragged node being
     * dropped in the current level. If inserted before the 0th node
     * of the same level, it is -1, after the 0th node, it is 1, and
     * it is 0 when it falls on it. And so on. With dropToGap, a more
     * complete judgment can be obtained.
     */
    dropPosition: number;
    /**
     * Indicates whether the dragged node is dropped between nodes, if
     *  it is false, it is dropped above a node
     */
    dropToGap: boolean;
}

export interface BasicRenderFullLabelProps {
    onClick: (e: any) => void;
    onContextMenu: (e: any) => void;
    onDoubleClick: (e: any) => void;
    className: string;
    onExpand: (e: any) => void;
    data: BasicTreeNodeData;
    level: number;
    // With virtualization this style must be applied to the DOM element
    style: any;
    onCheck: (e: any) => void;
    expandIcon: any;
    checkStatus: {
        checked: boolean;
        halfChecked: boolean;
    };
    expandStatus: {
        expanded: boolean;
        loading: boolean;
    };
    filtered?: boolean;
    searchWord?: string;
}

export interface BasicSearchRenderProps {
    className: string;
    placeholder: string;
    prefix: any;
    showClear?: boolean;
    value: string;
    onChange: (value: string) => void;
}

export interface TreeDataSimpleJson {
    [x: string]: string | TreeDataSimpleJson;
}

export interface Virtualize {
    itemSize: number;
    height?: number | string;
    width?: number | string;
}

export type CheckRelation = 'related' | 'unRelated';

export interface BasicTreeProps {
    autoExpandParent?: boolean;
    autoExpandWhenDragEnter?: boolean;
    blockNode?: boolean;
    children?: any;
    className?: string;
    expandAll?: boolean;
    defaultExpandAll?: boolean;
    defaultExpandedKeys?: string[];
    defaultValue?: BasicValue;
    directory?: boolean;
    disabled?: boolean;
    disableStrictly?: boolean;
    draggable?: boolean;
    emptyContent?: any;
    expandAction?: ExpandAction;
    expandedKeys?: string[];
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: BasicTreeNodeData) => boolean);
    hideDraggingNode?: boolean;
    labelEllipsis?: boolean;
    leafOnly?: boolean;
    loadData?: (treeNode?: BasicTreeNodeData) => Promise<void>;
    loadedKeys?: string[];
    motion?: boolean;
    multiple?: boolean;
    onChange?: (value: BasicValue) => void;
    onChangeWithObject?: boolean;
    onDoubleClick?: (e: any, node: BasicTreeNodeData) => void;
    onDragEnd?: (dragProps: BasicDragProps) => void;
    onDragEnter?: (dragEnterProps: BasicDragEnterProps) => void;
    onDragLeave?: (dragProps: BasicDragProps) => void;
    onDragOver?: (dragProps: BasicDragProps) => void;
    onDragStart?: (dragProps: BasicDragProps) => void;
    onDrop?: (onDragProps: BasicOnDragProps) => void;
    onExpand?: (expandedKeys: string[], expandedOtherProps: BasicExpandedOtherProps) => void;
    onLoad?: (loadedKeys?: Set<string>, treeNode?: BasicTreeNodeData) => void;
    onContextMenu?: (e: any, node: BasicTreeNodeData) => void;
    onSearch?: (searchValue: string, filteredExpandedKeys: string[]) => void;
    onSelect?: (selectedKey: string, selected: boolean, selectedNode: BasicTreeNodeData) => void;
    renderDraggingNode?: (nodeInstance: HTMLElement, node: BasicTreeNodeData) => HTMLElement;
    renderFullLabel?: (renderFullLabelProps: BasicRenderFullLabelProps) => any;
    renderLabel?: (label?: any, treeNode?: BasicTreeNodeData) => any;
    searchClassName?: string;
    searchPlaceholder?: string;
    searchRender?: ((searchRenderProps: BasicSearchRenderProps) => any) | false;
    searchStyle?: any;
    showClear?: boolean;
    showFilteredOnly?: boolean;
    showLine?: boolean;
    style?: any;
    treeData?: BasicTreeNodeData[];
    treeDataSimpleJson?: TreeDataSimpleJson;
    treeNodeFilterProp?: string;
    value?: BasicValue;
    virtualize?: Virtualize;
    icon?: any;
    checkRelation?: CheckRelation;
    keyMaps?: KeyMapProps;
    autoMergeValue?: boolean;
    'aria-label'?: string;
}

export interface BasicTreeInnerData {
    inputValue: string;
    keyEntities: BasicKeyEntities;
    treeData: BasicTreeNodeData[];
    flattenNodes: BasicFlattenNode[];
    selectedKeys: string[];
    checkedKeys: Set<string>;
    halfCheckedKeys: Set<string>;
    realCheckedKeys: Set<string>;
    motionKeys: Set<string>;
    motionType: TreeMotionType | null;
    expandedKeys: Set<string>;
    filteredKeys: Set<string>;
    filteredExpandedKeys: Set<string>;
    filteredShownKeys: Set<string>;
    prevProps: null | BasicTreeProps;
    loadedKeys: Set<string>;
    loadingKeys: Set<string>;
    cachedFlattenNodes?: BasicFlattenNode[];
    cachedKeyValuePairs: { [x: string]: string };
    disabledKeys: Set<string>;
    dragging: boolean;
    dragNodesKeys: Set<string>;
    dragOverNodeKey: string | null;
    dropPosition: number | null;
}

export interface BasicExpandedOtherProps {
    expanded: boolean;
    node: BasicTreeNodeData;
}

/** The members of a drag event the foundation reads; DOM events and React synthetic events both satisfy it */
export type TreeDragEvent = Pick<DragEvent, 'dataTransfer' | 'clientY'>;

/** E is the host's node mouse event (right or double click), which the foundation only passes through */
export interface TreeAdapter<E = unknown> extends DefaultAdapter<BasicTreeProps, BasicTreeInnerData> {
    updateInputValue: (value: string) => void;
    updateState: (states: Partial<BasicTreeInnerData>) => void;
    notifyExpand: (expandedKeys: Set<string>, { expanded, node }: BasicExpandedOtherProps) => void;
    notifySelect: (selectKey: string, bool: boolean, node: BasicTreeNodeData) => void;
    notifyChange: (value: BasicValue) => void;
    notifySearch: (input: string, filteredExpandedKeys: string[]) => void;
    notifyRightClick: (e: E, node: BasicTreeNodeData) => void;
    notifyDoubleClick: (e: E, node: BasicTreeNodeData) => void;
    notifyLoad: (loadedKeys: Set<string>, treeNode: BasicTreeNodeData) => void;
    notifyDragStart: (props: BasicDragProps) => void;
    notifyDragEnter: (props: BasicDragEnterProps) => void;
    notifyDragOver: (props: BasicDragProps) => void;
    notifyDragLeave: (props: BasicDragProps) => void;
    notifyDragEnd: (props: BasicDragProps) => void;
    notifyDrop: (props: BasicOnDragProps) => void;
    /** Keeps the rows from before a collapse for its animation; `undefined` drops them */
    setCachedFlattenNodes: (nodes?: BasicFlattenNode[]) => void;
    /** Scrolls the virtualized list to a row of flattenNodes, found by key once the rendered rows catch up with a search */
    scrollToNode: (key: string, align: ScrollAlign) => void;
}

/**
 * Every prop `TreeFoundation.deriveState` reads. A host that hands it a snapshot of the props instead of the props
 * object (Solid) picks these keys, so a prop deriveState starts reading goes on this list too.
 */
export const treeDerivedPropKeys = [
    'autoExpandParent',
    'checkRelation',
    'defaultExpandAll',
    'defaultExpandedKeys',
    'defaultValue',
    'disableStrictly',
    'expandAll',
    'expandedKeys',
    'filterTreeNode',
    'keyMaps',
    'loadData',
    'loadedKeys',
    'motion',
    'multiple',
    'onChangeWithObject',
    'showFilteredOnly',
    'treeData',
    'treeDataSimpleJson',
    'treeNodeFilterProp',
    'value',
] as const satisfies readonly (keyof BasicTreeProps)[];

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

export default class TreeFoundation<E = unknown> extends BaseFoundation<TreeAdapter<E>, BasicTreeProps, BasicTreeInnerData> {
    #dragNode: BasicTreeNodeProps | null = null;
    #dragEnterTimers = new Set<ReturnType<typeof setTimeout>>();
    #autoExpandTimer: ReturnType<typeof setTimeout> | undefined;
    #throttledDragOverUpdate: ReturnType<typeof throttle>;

    constructor(adapter: TreeAdapter<E>) {
        super({
            ...adapter,
        });
        // 16ms: at most one dropPosition update per frame while dragging
        this.#throttledDragOverUpdate = throttle((dropPosition: number) => {
            this._adapter.updateState({
                dropPosition,
            });
        }, 16);
    }

    #isMultiple() {
        return this.getProp('multiple');
    }

    #isAnimated() {
        return this.getProp('motion');
    }

    #isDisabled(treeNode: BasicTreeNodeProps = {}) {
        return this.getProp('disabled') || treeNode.disabled;
    }

    #isExpandControlled() {
        return this.getProp('expandedKeys') !== undefined;
    }

    #isLoadControlled() {
        return this.getProp('loadedKeys') !== undefined;
    }

    #showFilteredOnly() {
        const { inputValue } = this.getStates();
        const { showFilteredOnly } = this.getProps();
        return Boolean(inputValue) && showFilteredOnly;
    }

    #notifyJsonChange(key: string[] | string) {
        const data = this.getProp('treeDataSimpleJson');
        // array paths keep keys containing '.' unsplit
        const selectedPath = normalizedArr(key).map((i) => i.split(strings.JSON_KEY_SPLIT));
        const value = pick(data, selectedPath);
        this._adapter.notifyChange(value as BasicValue);
    }

    #notifyMultipleChange(key: string[]) {
        const { keyEntities } = this.getStates();
        const props = this.getProps();
        const { leafOnly, checkRelation, keyMaps, autoMergeValue } = props;
        let value;
        let keyList = [];
        if (checkRelation === 'related') {
            // leafOnly takes precedence over autoMergeValue={false}
            keyList = autoMergeValue || leafOnly ? normalizeKeyList(key, keyEntities, leafOnly, true) : key;
        } else if (checkRelation === 'unRelated') {
            keyList = key;
        }
        const nodes = keyList.map((key) => (keyEntities[key] ? keyEntities[key].data : getDataForKeyNotInKeyEntities(key, props)));
        if (this.getProp('onChangeWithObject')) {
            value = nodes;
        } else {
            value = getValueOrKey(nodes, keyMaps);
        }
        this._adapter.notifyChange(value);
    }

    #notifyChange(key: string[] | string) {
        const isMultiple = this.#isMultiple();
        const { keyMaps } = this.getProps();
        const { keyEntities } = this.getStates();
        if (this.getProp('treeDataSimpleJson')) {
            this.#notifyJsonChange(key);
        } else if (isMultiple) {
            this.#notifyMultipleChange(key as string[]);
        } else {
            let value;
            if (this.getProp('onChangeWithObject')) {
                value = get(keyEntities, key).data;
            } else {
                const { data } = get(keyEntities, key);
                value = getValueOrKey(data, keyMaps);
            }
            this._adapter.notifyChange(value);
        }
    }

    #handleSingleSelect(_e: any, { selected, eventKey, data }: BasicTreeNodeProps) {
        let selectedKeys = [...this.getState('selectedKeys')];
        const targetSelected = !selected;

        this._adapter.notifySelect(eventKey, true, data);

        if (!targetSelected) {
            return;
        }

        if (!selectedKeys.includes(eventKey)) {
            selectedKeys = [eventKey];
            this.#notifyChange(eventKey);
            if (!this._isControlledComponent()) {
                this._adapter.updateState({ selectedKeys });
            }
        }
    }

    #handleMultipleSelect(_e: any, treeNode: BasicTreeNodeProps) {
        const result = getMultipleSelectResult(treeNode, this.getProps(), this.getStates());
        if (!result) {
            return;
        }
        this._adapter.notifySelect(treeNode.eventKey, result.targetStatus, treeNode.data);
        this.#notifyChange(result.keys);
        if (!this._isControlledComponent()) {
            this._adapter.updateState(result.state);
        }
    }

    #setExpandedStatus({ eventKey, expanded, data }: BasicTreeNodeProps) {
        const { inputValue, treeData, filteredShownKeys, keyEntities } = this.getStates();
        const { keyMaps } = this.getProps();
        const isSearching = Boolean(inputValue);
        const showFilteredOnly = this.#showFilteredOnly();
        const expandedStateKey = isSearching ? 'filteredExpandedKeys' : 'expandedKeys';
        const expandedKeys = new Set(this.getState(expandedStateKey));

        let motionType: TreeMotionType = 'show';
        if (!expanded) {
            expandedKeys.add(eventKey);
        } else if (expandedKeys.has(eventKey)) {
            expandedKeys.delete(eventKey);
            motionType = 'hide';
        }
        // flattenNodes are rebuilt, never mutated, so the pre-collapse list can be kept as is
        this._adapter.setCachedFlattenNodes(motionType === 'hide' && this.#isAnimated() ? this.getState('flattenNodes') : undefined);

        if (!this.#isExpandControlled()) {
            const flattenNodes = flattenTreeData(treeData, expandedKeys, keyMaps, isSearching && showFilteredOnly && filteredShownKeys);
            let motionKeys = this.#isAnimated() ? getMotionKeys(eventKey, expandedKeys, keyEntities) : [];
            if (isSearching && showFilteredOnly) {
                motionKeys = motionKeys.filter((key) => filteredShownKeys.has(key));
            }
            const newState = {
                [expandedStateKey]: expandedKeys,
                flattenNodes,
                motionKeys: new Set(motionKeys),
                motionType,
            };
            this._adapter.updateState(newState);
        }

        return {
            expandedKeys,
            expanded: !expanded,
            data,
        };
    }

    #dragProps(event: any, node: BasicTreeNodeProps): BasicDragProps {
        return { event, node: this.getDragEventNodeData(node) };
    }

    #clearDragEnterTimers() {
        this.#dragEnterTimers.forEach((timer) => clearTimeout(timer));
        this.#dragEnterTimers.clear();
        clearTimeout(this.#autoExpandTimer);
        this.#autoExpandTimer = undefined;
    }

    #clearDragState() {
        this.#clearDragEnterTimers();
        this._adapter.updateState({
            dragOverNodeKey: '',
            dragging: false,
        });
    }

    protected getDragEventNodeData(node: BasicTreeNodeProps) {
        return {
            ...node.data,
            ...pick(node, ['expanded', 'pos', 'children']),
        };
    }

    /**
     * The state that props imply, given the previous state (modeled on rc-tree's getDerivedStateFromProps,
     * https://github.com/react-component/tree). `prevState.prevProps` holds the props of the last derivation.
     * Returns null when nothing changed, so a host that writes the result back settles.
     */
    static deriveState(props: BasicTreeProps, prevState: BasicTreeInnerData): Partial<BasicTreeInnerData> | null {
        const { prevProps } = prevState;
        const { keyMaps } = props;
        let treeData: BasicTreeNodeData[];
        let keyEntities = prevState.keyEntities || {};
        let valueEntities = prevState.cachedKeyValuePairs || {};
        const isSearching = Boolean(props.filterTreeNode && prevState.inputValue && prevState.inputValue.length);
        const newState: Partial<BasicTreeInnerData> = {};
        const isExpandControlled = props.expandedKeys !== undefined;

        const needUpdate = (name: string) => (prevProps ? !isEqual(prevProps[name], props[name]) : props[name] !== undefined);

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
        const expandAllWhenDataChange = dataUpdated && props.expandAll;
        if (!isSearching) {
            if (needUpdate('expandedKeys') || (prevProps && needUpdate('autoExpandParent'))) {
                newState.expandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
                if (prevProps && props.motion && !treeData) {
                    const { motionKeys, motionType } = calcMotionKeys(prevState.expandedKeys, newState.expandedKeys, keyEntities);
                    newState.motionKeys = new Set(motionKeys);
                    newState.motionType = motionType;
                    if (motionType === 'hide') {
                        // keeps collapsing rows rendered; a controlled change may not come from interaction
                        newState.cachedFlattenNodes = prevState.flattenNodes;
                    }
                }
            } else if ((!prevProps && (props.defaultExpandAll || props.expandAll)) || expandAllWhenDataChange) {
                newState.expandedKeys = new Set(Object.keys(keyEntities));
            } else if (!prevProps && props.defaultExpandedKeys) {
                newState.expandedKeys = calcExpandedKeys(props.defaultExpandedKeys, keyEntities);
            } else if (!prevProps && props.defaultValue !== undefined) {
                newState.expandedKeys = calcExpandedKeysForValues(props.defaultValue, keyEntities, props.multiple, valueEntities);
            } else if (!prevProps && props.value !== undefined) {
                newState.expandedKeys = calcExpandedKeysForValues(props.value, keyEntities, props.multiple, valueEntities);
            } else if (!isExpandControlled && dataUpdated && props.value !== undefined) {
                // with loadData a treeData change is a load; recalculating from value would collapse unselected nodes
                if (!(prevState.treeData && prevState.treeData?.length > 0 && props.loadData)) {
                    newState.expandedKeys = calcExpandedKeysForValues(props.value, keyEntities, props.multiple, valueEntities);
                }
            }

            if (treeData || newState.expandedKeys) {
                newState.flattenNodes = flattenTreeData(treeData || prevState.treeData, newState.expandedKeys || prevState.expandedKeys, keyMaps);
            }
        } else {
            if (treeData) {
                const filteredState = filterTreeData({
                    treeData,
                    inputValue: prevState.inputValue,
                    filterTreeNode: props.filterTreeNode,
                    filterProps: getFilterProp(props.treeNodeFilterProp, keyMaps),
                    showFilteredOnly: props.showFilteredOnly,
                    keyEntities: newState.keyEntities,
                    prevExpandedKeys: [...prevState.filteredExpandedKeys],
                    // the same structure under a new reference keeps the ancestors collapsed during the search
                    prevFilteredKeys: dataUpdated ? undefined : prevState.filteredKeys,
                    keyMaps: keyMaps,
                });
                newState.flattenNodes = filteredState.flattenNodes;
                newState.motionKeys = new Set([]);
                newState.filteredKeys = filteredState.filteredKeys;
                newState.filteredShownKeys = filteredState.filteredShownKeys;
                newState.filteredExpandedKeys = filteredState.filteredExpandedKeys;
            }

            if (props.expandedKeys) {
                const filteredExpandedKeys = calcExpandedKeys(props.expandedKeys, keyEntities, props.autoExpandParent || !prevProps);
                const unchanged = prevProps && !treeData && prevProps.showFilteredOnly === props.showFilteredOnly && filteredExpandedKeys.size === prevState.filteredExpandedKeys.size && [...filteredExpandedKeys].every((key) => prevState.filteredExpandedKeys.has(key));
                if (!unchanged) {
                    newState.filteredExpandedKeys = filteredExpandedKeys;
                    if (prevProps && props.motion && !treeData) {
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
        }

        const withObject = props.onChangeWithObject;
        const isMultiple = props.multiple;
        if (!isMultiple) {
            if (needUpdate('value')) {
                newState.selectedKeys = findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple);
            } else if (!prevProps && props.defaultValue !== undefined) {
                newState.selectedKeys = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
            } else if (treeData && props.value !== undefined) {
                newState.selectedKeys = findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple);
            }
        } else {
            let checkedKeyValues;
            if (needUpdate('value')) {
                checkedKeyValues = findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple);
            } else if (!prevProps && props.defaultValue !== undefined) {
                checkedKeyValues = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
            } else if (treeData) {
                checkedKeyValues = props.value !== undefined ? findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple) : keepExistingKeys(props.checkRelation === 'related' ? prevState.checkedKeys : prevState.realCheckedKeys, keyEntities);
            }

            if (checkedKeyValues) {
                if (props.checkRelation === 'unRelated') {
                    newState.realCheckedKeys = new Set(checkedKeyValues);
                } else if (props.checkRelation === 'related') {
                    const { checkedKeys, halfCheckedKeys } = calcCheckedKeys(checkedKeyValues, keyEntities);
                    newState.checkedKeys = checkedKeys;
                    newState.halfCheckedKeys = halfCheckedKeys;
                }
            }
        }

        if (needUpdate('loadedKeys')) {
            newState.loadedKeys = new Set(props.loadedKeys);
        }

        if (treeData && props.disableStrictly && props.checkRelation === 'related') {
            newState.disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
        }

        // a changed compared prop must still move prevProps, or a later render sees it as new
        const comparedPropChanged = ['expandedKeys', 'autoExpandParent', 'value', 'showFilteredOnly'].some(needUpdate);
        if (prevProps && Object.keys(newState).length === 0 && !comparedPropChanged) {
            return null;
        }
        // a copy: Vue passes the same reactive props object every time, so a stored reference always equals itself
        newState.prevProps = { ...props };
        return newState;
    }

    /** The state of a new tree: the empty state with what the props imply */
    static getInitialState(props: BasicTreeProps): BasicTreeInnerData {
        const state: BasicTreeInnerData = {
            inputValue: '',
            keyEntities: {},
            treeData: [],
            flattenNodes: [],
            selectedKeys: [],
            checkedKeys: new Set(),
            halfCheckedKeys: new Set(),
            realCheckedKeys: new Set(),
            motionKeys: new Set(),
            motionType: 'hide',
            expandedKeys: new Set(props.expandedKeys),
            filteredKeys: new Set(),
            filteredExpandedKeys: new Set(),
            filteredShownKeys: new Set(),
            prevProps: null,
            loadedKeys: new Set(),
            loadingKeys: new Set(),
            cachedFlattenNodes: undefined,
            cachedKeyValuePairs: {},
            disabledKeys: new Set(),
            dragging: false,
            dragNodesKeys: new Set(),
            dragOverNodeKey: null,
            dropPosition: null,
        };
        return { ...state, ...TreeFoundation.deriveState(props, state) };
    }

    override destroy() {
        super.destroy();
        if (this.#throttledDragOverUpdate) {
            this.#throttledDragOverUpdate.cancel();
        }

        this.#clearDragEnterTimers();
    }

    /** Writes the state derived from new props back, so handlers read what was rendered */
    syncDerivedState(derived: Partial<BasicTreeInnerData>) {
        this._adapter.updateState(derived);
    }

    scrollTo({ key, align = 'center' }: { key: string; align?: ScrollAlign }) {
        if (key && this.getState('flattenNodes')?.some((node: BasicFlattenNode) => node.key === key)) {
            this._adapter.scrollToNode(key, align);
        }
    }

    handleInputChange(sugInput: string) {
        this._adapter.updateInputValue(sugInput);
        const { selectedKeys, keyEntities, treeData } = this.getStates();
        const expandedKeys = new Set(this.getState('expandedKeys'));
        const { showFilteredOnly, filterTreeNode, treeNodeFilterProp, keyMaps } = this.getProps();
        const realFilterProp = getFilterProp(treeNodeFilterProp, keyMaps);
        let filteredOptsKeys: string[] = [];
        let expandedOptsKeys: string[] = [];
        let flattenNodes: BasicFlattenNode[] = [];
        let filteredShownKeys = new Set([]);

        if (!sugInput) {
            if (!this.#isExpandControlled()) {
                expandedOptsKeys = findAncestorKeys(selectedKeys, keyEntities, false);
                expandedOptsKeys.forEach((item) => expandedKeys.add(item));
            }
            flattenNodes = flattenTreeData(treeData, expandedKeys, keyMaps);
        } else {
            filteredOptsKeys = Object.values(keyEntities)
                .filter((item: BasicKeyEntity) => matchTreeNode(sugInput, item.data, filterTreeNode, realFilterProp))
                .map((item: BasicKeyEntity) => item.key);
            expandedOptsKeys = findAncestorKeys(filteredOptsKeys, keyEntities, false);
            const shownChildKeys = findDescendantKeys(filteredOptsKeys, keyEntities, true);
            filteredShownKeys = new Set([...shownChildKeys, ...expandedOptsKeys]);
            flattenNodes = flattenTreeData(treeData, new Set(expandedOptsKeys), keyMaps, showFilteredOnly && filteredShownKeys);
        }
        const newFilteredExpandedKeys = new Set(expandedOptsKeys);
        this._adapter.notifySearch(sugInput, Array.from(newFilteredExpandedKeys));
        this._adapter.updateState({
            expandedKeys,
            flattenNodes,
            motionKeys: new Set([]),
            filteredKeys: new Set(filteredOptsKeys),
            filteredExpandedKeys: newFilteredExpandedKeys,
            filteredShownKeys,
        });
    }

    handleNodeSelect(e: any, treeNode: BasicTreeNodeProps) {
        const isDisabled = this.#isDisabled(treeNode);
        if (isDisabled) {
            return;
        }
        if (!this.#isMultiple()) {
            this.#handleSingleSelect(e, treeNode);
        } else {
            this.#handleMultipleSelect(e, treeNode);
        }
    }

    handleNodeRightClick(e: E, treeNode: BasicTreeNodeProps) {
        this._adapter.notifyRightClick(e, treeNode.data);
    }

    handleNodeDoubleClick(e: E, treeNode: BasicTreeNodeProps) {
        this._adapter.notifyDoubleClick(e, treeNode.data);
    }

    handleNodeExpand(_e: any, treeNode: BasicTreeNodeProps) {
        const { loadData } = this.getProps();
        if (!loadData && (!treeNode.children || !treeNode.children.length)) {
            return;
        }
        // expandAction="click" reaches here from any row, a leaf included
        if (isTreeNodeLeaf(treeNode, loadData)) {
            return;
        }

        const { expandedKeys, data, expanded } = this.#setExpandedStatus(treeNode);
        this._adapter.notifyExpand(expandedKeys, {
            expanded,
            node: data,
        });
        if (expanded && loadData) {
            this.handleNodeLoad(treeNode.eventKey, data);
        }
    }

    /** Loads a node's children once; `key` is the node's entity key, which keyMaps may take from another field */
    handleNodeLoad(key: string, data: BasicTreeNodeData) {
        const { loadData } = this.getProps();
        const { loadedKeys = new Set<string>(), loadingKeys = new Set<string>() } = this.getStates();
        if (!loadData || loadedKeys.has(key) || loadingKeys.has(key)) {
            return;
        }

        void loadData(data)
            .then(() => {
                const prevLoadedKeys = new Set(this.getState('loadedKeys'));
                const prevLoadingKeys = new Set(this.getState('loadingKeys'));
                const newLoadedKeys = prevLoadedKeys.add(key);
                const newLoadingKeys = new Set(prevLoadingKeys);
                newLoadingKeys.delete(key);

                // onLoad should be triggered before internal setState to avoid `loadData` being triggered twice
                this._adapter.notifyLoad(newLoadedKeys, data);

                if (!this.#isLoadControlled()) {
                    this._adapter.updateState({
                        loadedKeys: newLoadedKeys,
                    });
                }
                this._adapter.updateState({
                    loadingKeys: newLoadingKeys,
                });
            })
            .finally(() => {
                // on rejection too, so the node can be retried
                const currentLoadingKeys = this.getState('loadingKeys');
                if (currentLoadingKeys.has(key)) {
                    const newLoadingKeys = new Set(currentLoadingKeys);
                    newLoadingKeys.delete(key);
                    this._adapter.updateState({ loadingKeys: newLoadingKeys });
                }
            });

        this._adapter.updateState({ loadingKeys: new Set<string>(loadingKeys).add(key) });
    }

    handleNodeDragStart(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        const { keyEntities } = this.getStates();
        const { hideDraggingNode, renderDraggingNode } = this.getProps();
        const { eventKey, nodeInstance, data } = treeNode;

        if (hideDraggingNode || renderDraggingNode) {
            let dragImg;
            if (typeof renderDraggingNode === 'function') {
                dragImg = renderDraggingNode(nodeInstance, data);
            } else if (hideDraggingNode) {
                dragImg = nodeInstance.cloneNode(true);
                dragImg.style.opacity = 0;
            }
            document.body.appendChild(dragImg);
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            // the browser captures the drag image after dragstart ends
            setTimeout(() => dragImg.remove());
        }

        this.#dragNode = treeNode;

        this._adapter.updateState({
            dragging: true,
            dragNodesKeys: new Set(getDragNodesKeys(eventKey, keyEntities)),
        });

        this._adapter.notifyDragStart(this.#dragProps(e, treeNode));
    }

    handleNodeDragEnter(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        const { dragNodesKeys } = this.getStates();
        const { autoExpandWhenDragEnter } = this.getProps();
        const { eventKey, expanded } = treeNode;
        const dragNode = this.#dragNode;
        if (!dragNode || dragNodesKeys.has(eventKey)) {
            return;
        }
        const dropPosition = calcDropRelativePosition(e, treeNode);

        if (dragNode.eventKey === eventKey && dropPosition === 0) {
            this._adapter.updateState({
                dragOverNodeKey: '',
                dropPosition: null,
            });
            return;
        }

        // after the state cleared in dragleave is applied
        const timer = setTimeout(() => {
            this.#dragEnterTimers.delete(timer);
            this._adapter.updateState({
                dragOverNodeKey: eventKey,
                dropPosition,
            });

            if (!autoExpandWhenDragEnter || expanded) {
                this._adapter.notifyDragEnter(this.#dragProps(e, treeNode));
                return;
            }

            // delayed so a quick pass over a node does not expand it
            clearTimeout(this.#autoExpandTimer);
            this.#autoExpandTimer = setTimeout(() => {
                const { expandedKeys: newExpandedKeys } = this.#setExpandedStatus(treeNode);
                this._adapter.notifyDragEnter({
                    ...this.#dragProps(e, treeNode),
                    expandedKeys: [...newExpandedKeys],
                });
            }, 400);
        }, 0);
        this.#dragEnterTimers.add(timer);
    }

    handleNodeDragOver(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        const { dropPosition, dragNodesKeys, dragOverNodeKey } = this.getStates();
        const { eventKey } = treeNode;

        if (dragNodesKeys.has(eventKey)) {
            return;
        }

        if (this.#dragNode && eventKey === dragOverNodeKey) {
            const newPos = calcDropRelativePosition(e, treeNode);
            if (dropPosition === newPos) {
                return;
            }
            this.#throttledDragOverUpdate(newPos);
        }

        this._adapter.notifyDragOver(this.#dragProps(e, treeNode));
    }

    handleNodeDragLeave(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        this.#throttledDragOverUpdate.cancel();
        // the pending auto expand belongs to the node being left; a node entered next schedules its own
        clearTimeout(this.#autoExpandTimer);
        this._adapter.updateState({
            dragOverNodeKey: '',
        });
        this._adapter.notifyDragLeave(this.#dragProps(e, treeNode));
    }

    handleNodeDragEnd(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        this.#throttledDragOverUpdate.flush();
        this.#clearDragState();
        this._adapter.notifyDragEnd(this.#dragProps(e, treeNode));
        this.#dragNode = null;
    }

    handleNodeDrop(e: TreeDragEvent, treeNode: BasicTreeNodeProps) {
        this.#throttledDragOverUpdate.flush();
        const { dropPosition, dragNodesKeys } = this.getStates();
        const { eventKey, pos } = treeNode;
        const dragNode = this.#dragNode;
        this.#clearDragState();
        // a drop from outside the tree (files, another tree) has no node of this tree to move
        if (!dragNode || dragNodesKeys.has(eventKey)) {
            return;
        }

        const dropRes = {
            dragNode: this.getDragEventNodeData(dragNode),
            dragNodesKeys: [...dragNodesKeys],
            dropPosition: calcDropActualPosition(pos, dropPosition),
            dropToGap: dropPosition !== 0,
        };

        this._adapter.notifyDrop({ ...this.#dragProps(e, treeNode), ...dropRes });
        this.#dragNode = null;
    }
}
