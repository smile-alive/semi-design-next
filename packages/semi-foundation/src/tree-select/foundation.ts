import { isEqual } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import type { VALIDATE_STATUS } from '../base/constants';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from '../tree-select/constants';
import type { BasicTreeInnerData, BasicTreeProps, BasicTreeNodeData, BasicTreeNodeProps, BasicKeyEntity, BasicExpandedOtherProps, TreeMotionType } from '../tree/foundation';
import { calcRelatedCheckedKeys, getDataForKeyNotInKeyEntities, getMultipleSelectResult } from '../tree/shared';
import {
    flattenTreeData,
    findDescendantKeys,
    findAncestorKeys,
    matchTreeNode,
    normalizeKeyList,
    getMotionKeys,
    calcCheckedKeys,
    getValueOrKey,
    convertDataToEntities,
    calcExpandedKeysForValues,
    calcMotionKeys,
    findKeysForValues,
    calcExpandedKeys,
    calcDisabledKeys,
    normalizeValue,
    filterTreeData,
    getFilterProp,
} from '../tree/tree-util';
import { isInnerControlActivation, isTextEditor } from '../utils/a11y';
import isEnterPress from '../utils/is-enter-press';
import { ESC_KEY } from '../utils/key-code';
import type { ArrayElement, Size } from '../utils/type';

export type { Size };

export type ValidateStatus = ArrayElement<typeof VALIDATE_STATUS>;

export type BasicRenderSelectedItemInMultiple = (
    treeNode: BasicTreeNodeData,
    otherProps: { index: number | string; onClose: (tagContent: any, e: any) => void }
) => {
    isRenderInTag: boolean;
    content: any;
};
export type BasicRenderSelectedItemInSingle = (treeNode: BasicTreeNodeData) => any;
export type BasicRenderSelectedItem = BasicRenderSelectedItemInSingle | BasicRenderSelectedItemInMultiple;

export interface BasicTriggerRenderProps {
    componentProps: BasicTreeSelectProps;
    disabled: boolean;
    inputValue: string;
    placeholder: string;
    value: BasicTreeNodeData[];
    onClear: (e: any) => void;
    onSearch: (inputValue: string) => void;
    onRemove: (key: string) => void;
}

export type BasicOnChangeWithObject = (node: BasicTreeNodeData[] | BasicTreeNodeData, e: any) => void;
export type BasicOnChangeWithBasic = (value: BasicTreeNodeData['value'], node: BasicTreeNodeData[] | BasicTreeNodeData, e: any) => void;

export interface BasicOnChange {
    (node: BasicTreeNodeData[] | BasicTreeNodeData, e: any): void;
    (value: BasicTreeNodeData['value'] | Array<BasicTreeNodeData['value']>, node: BasicTreeNodeData[] | BasicTreeNodeData, e: any): void;
}

export interface BasicTreeSelectProps extends Pick<
    BasicTreeProps,
    | 'virtualize'
    | 'renderFullLabel'
    | 'renderLabel'
    | 'autoExpandParent'
    | 'className'
    | 'defaultExpandAll'
    | 'defaultExpandedKeys'
    | 'defaultValue'
    | 'disabled'
    | 'emptyContent'
    | 'expandAction'
    | 'expandedKeys'
    | 'filterTreeNode'
    | 'labelEllipsis'
    | 'leafOnly'
    | 'multiple'
    | 'onChangeWithObject'
    | 'showClear'
    | 'showFilteredOnly'
    | 'style'
    | 'treeData'
    | 'treeNodeFilterProp'
    | 'value'
    | 'onExpand'
    | 'expandAll'
    | 'disableStrictly'
    | 'aria-label'
    | 'checkRelation'
    | 'keyMaps'
> {
    autoMergeValue?: boolean;
    preventScroll?: boolean;
    borderless?: boolean;
    motion?: boolean;
    arrowIcon?: any;
    autoAdjustOverflow?: boolean;
    clickToHide?: boolean;
    defaultOpen?: boolean;
    dropdownClassName?: string;
    dropdownMatchSelectWidth?: boolean;
    dropdownStyle?: any;
    insetLabel?: any;
    maxTagCount?: number;
    motionExpand?: boolean;
    optionListStyle?: any;
    outerBottomSlot?: any;
    outerTopSlot?: any;
    placeholder?: string;
    prefix?: any;
    remote?: boolean;
    searchAutoFocus?: boolean;
    searchPlaceholder?: string;
    showSearchClear?: boolean;
    size?: Size;
    suffix?: any;
    treeNodeLabelProp?: string;
    validateStatus?: ValidateStatus;
    searchPosition?: typeof strings.SEARCH_POSITION_DROPDOWN | typeof strings.SEARCH_POSITION_TRIGGER;
    stopPropagation?: boolean | string;
    loadedKeys?: string[];
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: any;
    clickTriggerToHide?: boolean;
    loadData?: (data: BasicTreeNodeData) => Promise<void>;
    onSelect?: (selectedKey: string, selected: boolean, selectedNode: BasicTreeNodeData) => void;
    searchRender?: boolean | ((inputProps: any) => any);
    renderSelectedItem?: BasicRenderSelectedItem;
    onBlur?: (e: any) => void;
    onSearch?: (searchValue: string, filteredExpandedKeys: string[], filteredNodes: BasicTreeNodeData[]) => void;
    onChange?: BasicOnChange;
    onFocus?: (e: any) => void;
    onVisibleChange?: (isVisible: boolean) => void;
    onLoad?: (keys: Set<string>, data: BasicTreeNodeData) => void;
}

export interface BasicTreeSelectInnerData extends Pick<
    BasicTreeInnerData,
    | 'keyEntities'
    | 'treeData'
    | 'flattenNodes'
    | 'cachedFlattenNodes'
    | 'selectedKeys'
    | 'checkedKeys'
    | 'halfCheckedKeys'
    | 'motionKeys'
    | 'motionType'
    | 'expandedKeys'
    | 'filteredKeys'
    | 'filteredExpandedKeys'
    | 'filteredShownKeys'
    | 'cachedKeyValuePairs'
    | 'inputValue'
    | 'disabledKeys'
    | 'loadedKeys'
    | 'loadingKeys'
    | 'realCheckedKeys'
> {
    inputTriggerFocus: boolean;
    isOpen: boolean;
    prevProps: BasicTreeSelectProps | null;
    isFocus: boolean;
}

/**
 * E is the host's trigger click or key event, passed on to onFocus and onBlur; focus entering or leaving passes the
 * native FocusEvent, a mousedown outside blurs with the native MouseEvent
 */
export interface TreeSelectAdapter<P extends BasicTreeSelectProps = BasicTreeSelectProps, S extends BasicTreeSelectInnerData = BasicTreeSelectInnerData, E = unknown> extends DefaultAdapter<P, S> {
    updateInputValue: (value: string) => void;
    updateState: (states: Partial<BasicTreeSelectInnerData>) => void;
    notifySelect: (selectedKey: string, selected: boolean, selectedNode: BasicTreeNodeData) => void;
    notifySearch: (input: string, filteredExpandedKeys: string[], filteredNodes: BasicTreeNodeData[]) => void;
    /** Keeps the rows from before a collapse for its animation; `undefined` drops them */
    setCachedFlattenNodes: (nodes?: BasicTreeInnerData['flattenNodes']) => void;
    /** Writes `isOpen: true` only; the foundation sends the visibility notification */
    openMenu: () => void;
    /** Writes `isOpen: false` and resets host-side view state only; the foundation sends the visibility notification */
    closeMenu: () => void;
    notifyVisibleChange: (visible: boolean) => void;
    notifyClear: (e: any) => void;
    notifyChange: BasicOnChangeWithBasic;
    notifyChangeWithObject: BasicOnChangeWithObject;
    notifyExpand: (expandedKeys: Set<string>, expandedOtherProps: BasicExpandedOtherProps) => void;
    notifyFocus: (e: E | FocusEvent) => void;
    notifyBlur: (e: E | MouseEvent | FocusEvent) => void;
    notifyLoad: (newLoadedKeys: Set<string>, data: BasicTreeNodeData) => void;
    /** Focuses the search input: the one in the dropdown, on the trigger, or the multiple-mode TagInput */
    focusInput: () => void;
    /** Focuses the element on the trigger that takes the keyboard: its search input, its tags or the trigger itself */
    focusTrigger: () => void;
    updateIsFocus: (bool: boolean) => void;
    isInTrigger: (node?: EventTarget | null) => boolean;
}

/**
 * Every prop `TreeSelectFoundation.deriveState` reads. A host that hands it a snapshot of the props instead of the
 * props object (Solid) picks these keys, so a prop deriveState starts reading goes on this list too.
 */
export const treeSelectDerivedPropKeys = [
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
    'loadedKeys',
    'motion',
    'multiple',
    'onChangeWithObject',
    'remote',
    'showFilteredOnly',
    'treeData',
    'treeNodeFilterProp',
    'value',
] as const satisfies readonly (keyof BasicTreeSelectProps)[];

/**
 * The uncontrolled selection across a treeData change. A key the previous treeData did not have is a defaultValue
 * placeholder that holds the value, so it becomes the key of the node with that value once such a node arrives
 */
function keepUncontrolledKeys(keys: Iterable<string>, prevState: BasicTreeSelectInnerData, keyEntities: BasicTreeSelectInnerData['keyEntities'], valueEntities: BasicTreeSelectInnerData['cachedKeyValuePairs']) {
    return [...keys].flatMap((key) => {
        if (!(key in prevState.keyEntities)) {
            return [valueEntities[key] ?? key];
        }
        return key in keyEntities ? [key] : [];
    });
}

export default class TreeSelectFoundation<P extends BasicTreeSelectProps = BasicTreeSelectProps, S extends BasicTreeSelectInnerData = BasicTreeSelectInnerData, E = unknown> extends BaseFoundation<TreeSelectAdapter<P, S, E>, P, S> {
    // whether onBlur is owed for the focus now inside; isFocus cannot tell (a Tab in does not set it)
    #blurPending = false;
    // StrictMode and React Activity replay init on this instance after destroy, over a dropdown and focus the user
    // may have changed since: defaultOpen and searchAutoFocus belong to the first mount
    #initialized = false;

    #isMultiple() {
        return this.getProp('multiple');
    }

    #isAnimated() {
        return this.getProp('motionExpand');
    }

    #isDisabled(treeNode: BasicTreeNodeProps = {}) {
        return this.getProp('disabled') || treeNode.disabled;
    }

    #isExpandControlled() {
        return this.getProp('expandedKeys');
    }

    #isSelectToClose() {
        return !this.getProp('expandAction');
    }

    #isLoadControlled() {
        return this.getProp('loadedKeys');
    }

    #showFilteredOnly() {
        const { inputValue } = this.getStates();
        const { showFilteredOnly } = this.getProps();
        return Boolean(inputValue) && showFilteredOnly;
    }

    #notifyMultipleChange(key: string[], e?: E) {
        const { keyEntities } = this.getStates();
        const { leafOnly, checkRelation, keyMaps, autoMergeValue } = this.getProps();
        let keyList = [];
        if (checkRelation === 'related') {
            // leafOnly takes precedence over autoMergeValue={false}
            keyList = autoMergeValue || leafOnly ? normalizeKeyList(key, keyEntities, leafOnly, true) : key;
        } else if (checkRelation === 'unRelated') {
            keyList = key;
        }
        const props = this.getProps();
        const nodes = keyList.map((key) => TreeSelectFoundation.getNodeData(key, keyEntities, props));
        if (this.getProp('onChangeWithObject')) {
            this._adapter.notifyChangeWithObject(nodes, e);
        } else {
            const value = getValueOrKey(nodes, keyMaps);
            this._adapter.notifyChange(value, nodes, e);
        }
    }

    #notifyChange(key: any, e?: E) {
        const { keyEntities } = this.getStates();
        const { keyMaps } = this.getProps();
        if (this.#isMultiple() && Array.isArray(key)) {
            this.#notifyMultipleChange(key, e);
        } else {
            const nodes = key === undefined ? key : keyEntities[key].data;
            const value = key === undefined ? key : getValueOrKey(nodes, keyMaps);
            if (this.getProp('onChangeWithObject')) {
                this._adapter.notifyChangeWithObject(nodes, e);
            } else {
                this._adapter.notifyChange(value, nodes, e);
            }
        }
    }

    #notifyFocus(e: E | FocusEvent) {
        if (!this.#blurPending && !this.#isDisabled()) {
            this.#blurPending = true;
            this._adapter.notifyFocus(e);
        }
    }

    #notifyBlur(e: E | MouseEvent | FocusEvent) {
        this.#blurPending = false;
        this._adapter.notifyBlur(e);
    }

    /** Loads a node's children once, after it is expanded */
    #handleNodeLoad(key: string, data: BasicTreeNodeData) {
        const { loadData } = this.getProps();
        const { loadedKeys, loadingKeys } = this.getStates();
        if (!loadData || loadedKeys.has(key) || loadingKeys.has(key)) {
            return;
        }
        void loadData(data)
            .then(() => {
                const newLoadedKeys = new Set(this.getState('loadedKeys') as Set<string>).add(key);
                const newLoadingKeys = new Set(this.getState('loadingKeys') as Set<string>);
                newLoadingKeys.delete(key);
                this._adapter.notifyLoad(newLoadedKeys, data);
                if (!this.#isLoadControlled()) {
                    this._adapter.updateState({ loadedKeys: newLoadedKeys });
                }
                this._adapter.updateState({ loadingKeys: newLoadingKeys });
            })
            .finally(() => {
                // on rejection too, so the node can be retried
                const currentLoadingKeys = this.getState('loadingKeys') as Set<string>;
                if (currentLoadingKeys.has(key)) {
                    const newLoadingKeys = new Set(currentLoadingKeys);
                    newLoadingKeys.delete(key);
                    this._adapter.updateState({ loadingKeys: newLoadingKeys });
                }
            });
        this._adapter.updateState({ loadingKeys: new Set<string>(loadingKeys).add(key) });
    }

    #focusInput() {
        this._adapter.focusInput();
    }

    #handleTriggerFocus(e: E) {
        this._adapter.updateIsFocus(true);
        this.#notifyFocus(e);
    }

    #open() {
        // reopening inside the exit animation skips afterClose, which would leave the last search's filtered tree
        if (this.getProp('filterTreeNode')) {
            this.#clearInput();
        }
        this._adapter.openMenu();
        this._adapter.notifyVisibleChange(true);
    }

    #clearInput() {
        const { expandedKeys, selectedKeys, keyEntities, treeData } = this.getStates();
        const { keyMaps } = this.getProps();
        const newExpandedKeys: Set<string> = new Set(expandedKeys);
        // controlled expandedKeys stay as the owner gave them
        const expandedOptsKeys = this.#isExpandControlled() ? [] : findAncestorKeys(selectedKeys, keyEntities, false);
        expandedOptsKeys.forEach((item) => newExpandedKeys.add(item));
        const newFlattenNodes = flattenTreeData(treeData, newExpandedKeys, keyMaps);

        this._adapter.updateState({
            expandedKeys: newExpandedKeys,
            flattenNodes: newFlattenNodes,
            inputValue: '',
            motionKeys: new Set([]),
            filteredKeys: new Set([]),
            filteredExpandedKeys: new Set(expandedOptsKeys),
            filteredShownKeys: new Set([]),
        });
    }

    #handleInputChange(searchValue: string) {
        this._adapter.updateInputValue(searchValue);
        const { expandedKeys, selectedKeys, keyEntities, treeData } = this.getStates();
        const { showFilteredOnly, filterTreeNode, treeNodeFilterProp, keyMaps, remote } = this.getProps();

        // Remote search skips local filtering: only inputValue is updated and onSearch is called
        if (remote) {
            this._adapter.notifySearch(searchValue, [], []);
            return;
        }

        const realFilterProp = getFilterProp(treeNodeFilterProp, keyMaps);
        const newExpandedKeys: Set<string> = new Set(expandedKeys);
        let filteredNodes: BasicTreeNodeData[] = [];
        let filteredOptsKeys: string[] = [];
        let expandedOptsKeys = [];
        let newFlattenNodes = [];
        let filteredShownKeys = new Set([]);
        if (!searchValue) {
            if (!this.#isExpandControlled()) {
                expandedOptsKeys = findAncestorKeys(selectedKeys, keyEntities, false);
                expandedOptsKeys.forEach((item) => newExpandedKeys.add(item));
            }
            newFlattenNodes = flattenTreeData(treeData, newExpandedKeys, keyMaps);
        } else {
            const filteredOpts = Object.values(keyEntities).filter(({ data }: BasicKeyEntity) => {
                return matchTreeNode(searchValue, data, filterTreeNode, realFilterProp);
            });
            filteredNodes = filteredOpts.map((item: BasicKeyEntity) => item.data);
            filteredOptsKeys = filteredOpts.map((item: BasicKeyEntity) => item.key);
            expandedOptsKeys = findAncestorKeys(filteredOptsKeys, keyEntities, false);
            const shownChildKeys = findDescendantKeys(filteredOptsKeys, keyEntities, true);
            filteredShownKeys = new Set([...shownChildKeys, ...expandedOptsKeys]);
            newFlattenNodes = flattenTreeData(treeData, new Set(expandedOptsKeys), keyMaps, showFilteredOnly && filteredShownKeys);
        }
        const newFilteredExpandedKeys = new Set(expandedOptsKeys);
        this._adapter.notifySearch(searchValue, Array.from(newFilteredExpandedKeys), filteredNodes);
        this._adapter.updateState({
            expandedKeys: newExpandedKeys,
            flattenNodes: newFlattenNodes,
            motionKeys: new Set([]),
            filteredKeys: new Set(filteredOptsKeys),
            filteredExpandedKeys: newFilteredExpandedKeys,
            filteredShownKeys,
        });
    }

    #handleSingleSelect(e: E, { selected, eventKey, data, children }: BasicTreeNodeProps) {
        let selectedKeys = [...this.getState('selectedKeys')];
        const { clickToHide } = this.getProps();
        this._adapter.notifySelect(eventKey, true, data);

        if (!selectedKeys.includes(eventKey) && !selected) {
            selectedKeys = [eventKey];
            this.#notifyChange(eventKey, e);
            if (!this._isControlledComponent()) {
                this._adapter.updateState({ selectedKeys });
            }
        }
        if (clickToHide && (this.#isSelectToClose() || !children)) {
            // the dropdown search input or a slot field may hold the focus, and hiding the dropdown would drop it to
            // the body (APG: return it to the combobox); focus outside the component is left alone
            if (this.#blurPending) {
                this._adapter.focusTrigger();
            }
            this.close();
            this.handleTriggerBlur(e);
        }
    }

    #handleMultipleSelect(e: E, treeNode: BasicTreeNodeProps) {
        const props = this.getProps();
        const state = this.getStates();
        const result = getMultipleSelectResult(treeNode, props, state);
        if (result) {
            this._adapter.notifySelect(treeNode.eventKey, result.targetStatus, treeNode.data);
            this.#notifyChange(result.keys, e);
            if (!this._isControlledComponent()) {
                this._adapter.updateState(result.state);
            }
        }
        if (props.searchPosition === strings.SEARCH_POSITION_TRIGGER && state.inputValue !== '') {
            // not just the text: the list must leave the search result too, and onSearch hears the cleared keyword
            this.#handleInputChange('');
        }
    }

    #handleNodeExpandInSearch(_e: unknown, { eventKey, expanded, data }: BasicTreeNodeProps) {
        const { treeData, filteredShownKeys, keyEntities } = this.getStates();
        const { keyMaps } = this.getProps();
        const showFilteredOnly = this.#showFilteredOnly();
        const filteredExpandedKeys = new Set(this.getState('filteredExpandedKeys'));
        let motionType: TreeMotionType = 'show';

        if (!expanded) {
            filteredExpandedKeys.add(eventKey);
        } else if (filteredExpandedKeys.has(eventKey)) {
            filteredExpandedKeys.delete(eventKey);
            motionType = 'hide';
        }

        // keep the previous flattenNodes so the collapsing rows stay rendered; they are rebuilt, never mutated
        this._adapter.setCachedFlattenNodes(motionType === 'hide' && this.#isAnimated() ? this.getState('flattenNodes') : undefined);

        if (!this.#isExpandControlled()) {
            const flattenNodes = flattenTreeData(treeData, filteredExpandedKeys, keyMaps, showFilteredOnly && filteredShownKeys);
            let motionKeys = this.#isAnimated() ? getMotionKeys(eventKey, filteredExpandedKeys, keyEntities) : [];
            // a hidden first child would leave NodeList no row to anchor the animated group to
            if (showFilteredOnly) {
                motionKeys = motionKeys.filter((key) => filteredShownKeys.has(key));
            }
            const newState = {
                filteredExpandedKeys,
                flattenNodes,
                motionKeys: new Set(motionKeys),
                motionType,
            };

            this._adapter.updateState(newState);
        }

        this._adapter.notifyExpand(filteredExpandedKeys, {
            expanded: !expanded,
            node: data,
        });
        if (!expanded) {
            this.#handleNodeLoad(eventKey, data);
        }
    }

    /**
     * The state that props imply, given the previous state: the class component's getDerivedStateFromProps.
     * `prevState.prevProps` holds the props of the last derivation. Returns null when nothing changed, so a host
     * that writes the result back settles.
     */
    static deriveState(props: BasicTreeSelectProps, prevState: BasicTreeSelectInnerData): Partial<BasicTreeSelectInnerData> | null {
        const { prevProps } = prevState;
        const { keyMaps } = props;
        const needUpdate = (name: string) => (prevProps ? !isEqual(prevProps[name], props[name]) : props[name] !== undefined);

        let treeData: BasicTreeNodeData[];
        const withObject = props.onChangeWithObject;
        let keyEntities = prevState.keyEntities || {};
        let valueEntities = prevState.cachedKeyValuePairs || {};
        const newState: Partial<BasicTreeSelectInnerData> = {};
        const needUpdateTreeData = needUpdate('treeData');
        const needUpdateExpandedKeys = needUpdate('expandedKeys');
        const isSearching = Boolean(props.filterTreeNode && !props.remote && prevState.inputValue && prevState.inputValue.length);
        if (needUpdateTreeData) {
            treeData = props.treeData;
            newState.treeData = treeData;
            const entitiesMap = convertDataToEntities(treeData, keyMaps);
            newState.keyEntities = { ...entitiesMap.keyEntities };
            keyEntities = newState.keyEntities;
            newState.cachedKeyValuePairs = { ...entitiesMap.valueEntities };
            valueEntities = newState.cachedKeyValuePairs;
        }

        if (treeData && props.motion && prevProps && !isEqual(Object.keys(newState.keyEntities), Object.keys(prevState.keyEntities))) {
            newState.motionKeys = new Set([]);
            newState.motionType = null;
        }
        const expandAllWhenDataChange = needUpdateTreeData && props.expandAll;
        if (!isSearching) {
            if (needUpdateExpandedKeys || (prevProps && needUpdate('autoExpandParent'))) {
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
                newState.expandedKeys = calcExpandedKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), keyEntities, props.multiple, valueEntities);
            } else if (!prevProps && props.value !== undefined) {
                newState.expandedKeys = calcExpandedKeysForValues(normalizeValue(props.value, withObject, keyMaps), keyEntities, props.multiple, valueEntities);
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

        const isMultiple = props.multiple;
        if (!isMultiple) {
            if (needUpdate('value')) {
                newState.selectedKeys = findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple);
            } else if (!prevProps && props.defaultValue !== undefined) {
                newState.selectedKeys = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
            } else if (treeData) {
                newState.selectedKeys = props.value !== undefined ? findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple) : keepUncontrolledKeys(prevState.selectedKeys, prevState, keyEntities, valueEntities);
            }
        } else {
            let checkedKeyValues;
            if (needUpdate('value')) {
                checkedKeyValues = findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple);
            } else if (!prevProps && props.defaultValue !== undefined) {
                checkedKeyValues = findKeysForValues(normalizeValue(props.defaultValue, withObject, keyMaps), valueEntities, isMultiple);
            } else if (treeData) {
                checkedKeyValues = props.value !== undefined ? findKeysForValues(normalizeValue(props.value, withObject, keyMaps), valueEntities, isMultiple) : keepUncontrolledKeys(props.checkRelation === 'related' ? prevState.checkedKeys : prevState.realCheckedKeys, prevState, keyEntities, valueEntities);
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
        const comparedPropChanged = needUpdateTreeData || needUpdateExpandedKeys || ['autoExpandParent', 'value', 'loadedKeys', 'showFilteredOnly'].some(needUpdate);
        if (prevProps && Object.keys(newState).length === 0 && !comparedPropChanged) {
            return null;
        }
        // a copy: Vue passes the same reactive props object every time, so a stored reference always equals itself
        newState.prevProps = { ...props };
        return newState;
    }

    /** The state of a new TreeSelect: the empty state with what the props imply */
    static getInitialState(props: BasicTreeSelectProps): BasicTreeSelectInnerData {
        const state: BasicTreeSelectInnerData = {
            inputTriggerFocus: false,
            isOpen: false,
            isFocus: false,
            inputValue: '',
            keyEntities: {},
            treeData: [],
            flattenNodes: [],
            cachedFlattenNodes: undefined,
            selectedKeys: [],
            checkedKeys: new Set(),
            halfCheckedKeys: new Set(),
            realCheckedKeys: new Set(),
            disabledKeys: new Set(),
            motionKeys: new Set(),
            motionType: 'hide',
            expandedKeys: new Set(props.expandedKeys),
            filteredKeys: new Set(),
            filteredExpandedKeys: new Set(),
            filteredShownKeys: new Set(),
            prevProps: null,
            cachedKeyValuePairs: {},
            loadedKeys: new Set(),
            loadingKeys: new Set(),
        };
        return { ...state, ...TreeSelectFoundation.deriveState(props, state) };
    }

    /** The keys the trigger shows: the selection, or in multiple mode the checked keys merged as onChange reports them */
    static getTriggerKeys(props: Pick<BasicTreeSelectProps, 'multiple' | 'checkRelation' | 'autoMergeValue' | 'leafOnly'>, { checkedKeys, realCheckedKeys, keyEntities, selectedKeys }: Pick<BasicTreeSelectInnerData, 'selectedKeys' | 'checkedKeys' | 'realCheckedKeys' | 'keyEntities'>) {
        if (!props.multiple) {
            return selectedKeys;
        }
        if (props.checkRelation === 'unRelated') {
            return [...realCheckedKeys];
        }
        // leafOnly takes precedence over autoMergeValue={false}
        if (props.autoMergeValue || props.leafOnly) {
            return normalizeKeyList([...checkedKeys], keyEntities, props.leafOnly, true);
        }
        return [...checkedKeys];
    }

    static hasValue(props: Pick<BasicTreeSelectProps, 'multiple' | 'checkRelation'>, { selectedKeys, checkedKeys, realCheckedKeys }: Pick<BasicTreeSelectInnerData, 'selectedKeys' | 'checkedKeys' | 'realCheckedKeys'>) {
        if (!props.multiple) {
            return selectedKeys.length > 0;
        }
        return props.checkRelation === 'unRelated' ? realCheckedKeys.size > 0 : checkedKeys.size > 0;
    }

    /** What the trigger shows for the single selection; pure, so render can call it */
    static getRenderTextInSingle(props: Record<string, any>, { selectedKeys, keyEntities }: Pick<BasicTreeSelectInnerData, 'selectedKeys' | 'keyEntities'>) {
        const { renderSelectedItem: propRenderSelectedItem, treeNodeLabelProp, keyMaps } = props;
        const realLabelName = keyMaps?.label ?? treeNodeLabelProp;
        const renderSelectedItem = typeof propRenderSelectedItem === 'function' ? propRenderSelectedItem : (item: BasicTreeNodeData) => get(item, realLabelName, null);
        const item = selectedKeys.length ? TreeSelectFoundation.getNodeData(selectedKeys[0], keyEntities, props) : null;
        return item ? renderSelectedItem(item) : null;
    }

    /**
     * The data of the node with `key`. A key missing from treeData gets a placeholder node, or under
     * onChangeWithObject the matching object of `value`/`defaultValue`, undefined when none matches
     */
    static getNodeData(key: string, keyEntities: BasicTreeSelectInnerData['keyEntities'], props: Parameters<typeof getDataForKeyNotInKeyEntities>[1]): BasicTreeNodeData | undefined {
        return keyEntities[key] && keyEntities[key].key === key ? keyEntities[key].data : getDataForKeyNotInKeyEntities(key, props);
    }

    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        const { searchAutoFocus, searchPosition, filterTreeNode } = this.getProps();
        const triggerSearch = searchPosition === strings.SEARCH_POSITION_TRIGGER && filterTreeNode;
        const triggerSearchAutoFocus = searchAutoFocus && triggerSearch;
        const able = !this.#isDisabled();
        if ((this.getProp('defaultOpen') || triggerSearchAutoFocus) && able) {
            this.#open();
        }
        if (triggerSearchAutoFocus && able) {
            this.#handleTriggerFocus(null);
        }
    }

    /** Writes the state derived from new props back, so handlers read what was rendered */
    syncDerivedState = (derived: Partial<BasicTreeSelectInnerData>) => {
        this._adapter.updateState(derived);
    };

    /** Searches as if `value` were typed, opening the dropdown first */
    search = (value: string) => {
        if (!this.getState('isOpen')) {
            this.#open();
        }
        this.#handleInputChange(value);
    };

    /** Focus entering the trigger (its search input, tags, clear button) or the dropdown from outside */
    handleTriggerFocus = (e: FocusEvent) => {
        this.#notifyFocus(e);
    };

    /**
     * Reports the blur once per focus: on a mousedown outside, a single pick that closes, or the focus leaving the
     * trigger and the dropdown (the component checks where it went)
     */
    handleTriggerBlur(e: E | MouseEvent | FocusEvent) {
        if (!this.#blurPending) {
            return;
        }
        this._adapter.updateIsFocus(false);
        this.#notifyBlur(e);
    }

    /**
     * The focus left the trigger and the dropdown (the component checks where it went): reports the blur, and closes
     * an open dropdown when the focus went to another element (APG combobox). A window blur has no target and keeps
     * the dropdown, as the native select does.
     */
    handleFocusLeave = (e: FocusEvent) => {
        this.handleTriggerBlur(e);
        if (e.relatedTarget && this.getState('isOpen')) {
            this.close();
        }
    };

    /** A mousedown outside the trigger and the dropdown, listened to while the TreeSelect is focused or open */
    handleClickOutside = (e: MouseEvent) => {
        this.handleTriggerBlur(e);
        if (this.getState('isOpen')) {
            this.close();
        }
    };

    handleKeyDown = (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === ESC_KEY) {
            const isOpen = this.getState('isOpen');
            // claim the key: closing removes the overlay layer first, and the stack would close an enclosing dialog
            if (isOpen) {
                e.preventDefault();
                // hiding the dropdown while it holds focus would drop focus to the body
                // (APG: return it to the combobox)
                this._adapter.focusTrigger();
                this.close();
            }
        }
    };

    onClickSingleTriggerSearchItem = () => {
        this.#focusInput();
    };

    close = () => {
        this._adapter.closeMenu();
        this._adapter.notifyVisibleChange(false);
        if (this.getProp('motionExpand')) {
            this._adapter.updateState({ motionKeys: new Set([]) });
        }
    };

    handleClick = (e: E & Pick<UIEvent, 'detail' | 'target' | 'currentTarget'>) => {
        const isDisabled = this.#isDisabled();
        const { isOpen, inputValue, isFocus } = this.getStates();
        const { searchPosition, clickTriggerToHide } = this.getProps();
        // Enter and Space on a control inside the trigger belong to it, so neither its keydown (passed here with
        // detail 0) nor its click toggles the popup; a pointer click still does
        if (isDisabled || isInnerControlActivation(e)) {
            return;
        } else {
            if (!isFocus) {
                this.#handleTriggerFocus(e);
            }
            if (this.getProp('filterTreeNode') && searchPosition === strings.SEARCH_POSITION_TRIGGER) {
                this.#focusInput();
            }
            if (isOpen) {
                if (searchPosition === 'trigger' && inputValue) {
                    return;
                }
                if (clickTriggerToHide) {
                    this.close();
                }
            } else {
                this.#open();
            }
        }
    };

    /**
     * Enter toggles the popup like a click; Down and Up open a closed one (APG combobox). Outside a text field (the
     * select-only combobox) Space toggles it like Enter, and Home and End open a closed one: the view moves to the
     * first or the last row, which lives in the view.
     */
    handleSelectionKeyDown = (e: E & Pick<KeyboardEvent, 'key' | 'preventDefault' | 'detail' | 'target' | 'currentTarget'>) => {
        const editing = isTextEditor(e.target);
        const opensOnKey = !this.getState('isOpen') && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || (!editing && (e.key === 'Home' || e.key === 'End')));
        if (opensOnKey || isEnterPress(e) || (e.key === ' ' && !editing)) {
            // Enter would also submit the form, Space scroll the page
            e.preventDefault();
            this.handleClick(e);
        }
    };

    // a custom trigger may clear without an event
    handleClear = (e?: E) => {
        const { searchPosition, filterTreeNode } = this.getProps();
        const { inputValue, selectedKeys } = this.getStates();
        const isControlled = this._isControlledComponent();
        const value: string | string[] | undefined = this.#isMultiple() ? [] : undefined;
        const hasValue = TreeSelectFoundation.hasValue(this.getProps(), this.getStates());
        // the clear button also shows for search text alone; that clears no value
        if (hasValue) {
            this.#notifyChange(value, e);
        }
        if (hasValue && !isControlled) {
            this._adapter.updateState({
                selectedKeys: [],
                checkedKeys: new Set(),
                halfCheckedKeys: new Set(),
                realCheckedKeys: new Set([]),
            });
        }
        if (filterTreeNode && searchPosition === strings.SEARCH_POSITION_TRIGGER) {
            if (inputValue !== '') {
                if (selectedKeys.length === 0) {
                    this.#handleInputChange('');
                } else {
                    this.#clearInput();
                }
            }
        }
        this._adapter.notifyClear(e);
    };

    removeTag = (eventKey: BasicTreeNodeData['key']) => {
        const props = this.getProps();
        const { disableStrictly, checkRelation, keyMaps } = props;
        const state = this.getStates();
        const { keyEntities, disabledKeys, realCheckedKeys } = state;
        const item = TreeSelectFoundation.getNodeData(eventKey, keyEntities, props);
        const disabledName = keyMaps?.disabled ?? 'disabled';
        if (item[disabledName] || (disableStrictly && disabledKeys.has(eventKey))) {
            return;
        }
        if (checkRelation === 'unRelated') {
            const newRealCheckedKeys = new Set(realCheckedKeys);
            newRealCheckedKeys.delete(eventKey);
            this.#notifyChange([...newRealCheckedKeys], null);
            if (!this._isControlledComponent()) {
                this._adapter.updateState({ realCheckedKeys: newRealCheckedKeys });
            }
        } else if (checkRelation === 'related') {
            // like unchecking the node in the tree: disableStrictly keeps the checked state of disabled descendants
            const { checkedKeys, halfCheckedKeys } = calcRelatedCheckedKeys(eventKey, false, disableStrictly, state);
            this.#notifyChange([...checkedKeys], null);
            if (!this._isControlledComponent()) {
                this._adapter.updateState({ checkedKeys, halfCheckedKeys });
            }
        }

        this._adapter.notifySelect(eventKey, false, item);
    };

    handleNodeSelect = (e: E, treeNode: BasicTreeNodeProps) => {
        const isDisabled = this.#isDisabled(treeNode);
        if (isDisabled) {
            return;
        }
        if (!this.#isMultiple()) {
            this.#handleSingleSelect(e, treeNode);
        } else {
            this.#handleMultipleSelect(e, treeNode);
        }
    };

    handleNodeExpand = (e: E, treeNode: BasicTreeNodeProps) => {
        const { loadData, keyMaps } = this.getProps();
        const { inputValue, keyEntities } = this.getStates();
        const isSearching = Boolean(inputValue);
        if (!loadData && (!treeNode.children || !treeNode.children.length)) {
            return;
        }

        const isExpandControlled = this.#isExpandControlled();
        if (isSearching) {
            this.#handleNodeExpandInSearch(e, treeNode);
            return;
        }

        const { treeData } = this.getStates();
        const expandedKeys = new Set(this.getState('expandedKeys'));
        let motionType: TreeMotionType = 'show';
        const { eventKey, expanded, data } = treeNode;
        if (!expanded) {
            expandedKeys.add(eventKey);
        } else if (expandedKeys.has(eventKey)) {
            expandedKeys.delete(eventKey);
            motionType = 'hide';
        }
        this._adapter.setCachedFlattenNodes(motionType === 'hide' && this.#isAnimated() ? this.getState('flattenNodes') : undefined);

        if (!isExpandControlled) {
            const flattenNodes = flattenTreeData(treeData, expandedKeys, keyMaps);
            const motionKeys = this.#isAnimated() ? getMotionKeys(eventKey, expandedKeys, keyEntities) : [];
            const newState = {
                expandedKeys,
                flattenNodes,
                motionKeys: new Set(motionKeys),
                motionType,
            };
            this._adapter.updateState(newState);
        }

        this._adapter.notifyExpand(expandedKeys, {
            expanded: !expanded,
            node: data,
        });
        if (!expanded) {
            this.#handleNodeLoad(eventKey, data);
        }
    };

    // Focus moving between the trigger's search input and the clear button stays inside; it must not clear the text
    handleInputTriggerBlur = (e?: { relatedTarget: EventTarget | null }) => {
        if (this._adapter.isInTrigger(e?.relatedTarget)) {
            return;
        }
        this._adapter.updateState({
            inputTriggerFocus: false,
        });
    };

    handleInputTriggerFocus = (e?: { relatedTarget: EventTarget | null }) => {
        if (this._adapter.isInTrigger(e?.relatedTarget)) {
            return;
        }
        this.#clearInput();
        this._adapter.updateState({
            inputTriggerFocus: true,
        });
    };

    handlePopoverOpen = () => {
        const { filterTreeNode, searchAutoFocus, searchPosition } = this.getProps();
        if (filterTreeNode && searchPosition === strings.SEARCH_POSITION_DROPDOWN && searchAutoFocus) {
            this.#focusInput();
        }
    };

    handleAfterClose = () => {
        // recalculating changes the option count; doing it before the popup is fully closed makes it flicker
        const { filterTreeNode } = this.getProps();
        if (filterTreeNode) {
            this.#clearInput();
        }
    };
}
