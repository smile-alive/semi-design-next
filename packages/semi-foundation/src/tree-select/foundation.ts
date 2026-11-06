import { get } from 'es-toolkit/compat';
import type { VALIDATE_STATUS } from '../base/constants';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from '../tree-select/constants';
import type { BasicTreeInnerData, BasicTreeProps, BasicTreeNodeData, BasicTreeNodeProps, BasicExpandedOtherProps, TreeMotionType } from '../tree/foundation';
import { calcRelatedCheckedKeys, deriveTreeState, getClearedSelection, getMultipleChange, getMultipleSelectResult, getNodeData, getSearchState, loadTreeNode } from '../tree/shared';
import { flattenTreeData, findAncestorKeys, normalizeKeyList, getMotionKeys, getValueOrKey } from '../tree/tree-util';
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
    notifySelect: (selectedKey: string, selected: boolean, selectedNode: BasicTreeNodeData) => void;
    notifySearch: (input: string, filteredExpandedKeys: string[], filteredNodes: BasicTreeNodeData[]) => void;
    /** Called right after `isOpen` is written; a host resets its own view state of the dropdown (the active row) here */
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
    isInTrigger: (node?: EventTarget | null) => boolean;
}

export default class TreeSelectFoundation<P extends BasicTreeSelectProps = BasicTreeSelectProps, S extends BasicTreeSelectInnerData = BasicTreeSelectInnerData, E = unknown> extends BaseFoundation<TreeSelectAdapter<P, S, E>, P, S> {
    // whether onBlur is owed for the focus now inside; isFocus cannot tell (a Tab in does not set it)
    #blurPending = false;

    /**
     * Every prop `deriveState` reads, which it keeps as `prevProps`. They change state during render, so there is no
     * `handlePropsChange`; a prop deriveState starts reading goes on this list too.
     */
    static override readonly propKeys = [
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
        return this.getProp('expandedKeys') !== undefined;
    }

    #isSelectToClose() {
        return !this.getProp('expandAction');
    }

    #showFilteredOnly() {
        const { inputValue } = this.getStates();
        const { showFilteredOnly } = this.getProps();
        return Boolean(inputValue) && showFilteredOnly;
    }

    #notifyMultipleChange(key: string[], e?: E) {
        const { nodes, value } = getMultipleChange(key, this.getProps(), this.getState('keyEntities'));
        if (this.getProp('onChangeWithObject')) {
            this.adapter.notifyChangeWithObject(nodes, e);
        } else {
            this.adapter.notifyChange(value, nodes, e);
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
                this.adapter.notifyChangeWithObject(nodes, e);
            } else {
                this.adapter.notifyChange(value, nodes, e);
            }
        }
    }

    #notifyFocus(e: E | FocusEvent) {
        if (!this.#blurPending && !this.#isDisabled()) {
            this.#blurPending = true;
            this.adapter.notifyFocus(e);
        }
    }

    #notifyBlur(e: E | MouseEvent | FocusEvent) {
        this.#blurPending = false;
        this.adapter.notifyBlur(e);
    }

    #handleNodeLoad(key: string, data: BasicTreeNodeData) {
        loadTreeNode(this, key, data, (loadedKeys, node) => this.adapter.notifyLoad(loadedKeys, node));
    }

    #focusInput() {
        this.adapter.focusInput();
    }

    #handleTriggerFocus(e: E) {
        this.setState({ isFocus: true });
        this.#notifyFocus(e);
    }

    #open() {
        // reopening inside the exit animation skips afterClose, which would leave the last search's filtered tree
        if (this.getProp('filterTreeNode')) {
            this.#clearInput();
        }
        this.setState({ isOpen: true });
        this.adapter.notifyVisibleChange(true);
    }

    #clearInput() {
        const { expandedKeys, selectedKeys, keyEntities, treeData } = this.getStates();
        const { keyMaps } = this.getProps();
        const newExpandedKeys: Set<string> = new Set(expandedKeys);
        const expandedOptsKeys = this.#isExpandControlled() ? [] : findAncestorKeys(selectedKeys, keyEntities, false);
        expandedOptsKeys.forEach((item) => newExpandedKeys.add(item));
        const newFlattenNodes = flattenTreeData(treeData, newExpandedKeys, keyMaps);

        this.setState({
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
        this.setState({ inputValue: searchValue });
        if (this.getProp('remote')) {
            this.adapter.notifySearch(searchValue, [], []);
            return;
        }
        const { filteredNodes, state } = getSearchState(searchValue, this.getProps(), this.getStates());
        this.adapter.notifySearch(searchValue, [...state.filteredExpandedKeys], filteredNodes);
        this.setState(state as S);
    }

    #handleSingleSelect(e: E, { selected, eventKey, data, children }: BasicTreeNodeProps) {
        let selectedKeys = [...this.getState('selectedKeys')];
        const { clickToHide } = this.getProps();
        this.adapter.notifySelect(eventKey, true, data);

        if (!selectedKeys.includes(eventKey) && !selected) {
            selectedKeys = [eventKey];
            this.#notifyChange(eventKey, e);
            if (!this.isControlledComponent()) {
                this.setState({ selectedKeys });
            }
        }
        if (clickToHide && (this.#isSelectToClose() || !children)) {
            // the dropdown search input or a slot field may hold the focus, and hiding the dropdown would drop it to
            // the body (APG: return it to the combobox); focus outside the component is left alone
            if (this.#blurPending) {
                this.adapter.focusTrigger();
            }
            this.close();
            this.#handleTriggerBlur(e);
        }
    }

    #handleMultipleSelect(e: E, treeNode: BasicTreeNodeProps) {
        const props = this.getProps();
        const state = this.getStates();
        const result = getMultipleSelectResult(treeNode, props, state);
        if (result) {
            this.adapter.notifySelect(treeNode.eventKey, result.targetStatus, treeNode.data);
            this.#notifyChange(result.keys, e);
            if (!this.isControlledComponent()) {
                this.setState(result.state as S);
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
        this.setState({ cachedFlattenNodes: motionType === 'hide' && this.#isAnimated() ? this.getState('flattenNodes') : undefined });

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

            this.setState(newState);
        }

        this.adapter.notifyExpand(filteredExpandedKeys, {
            expanded: !expanded,
            node: data,
        });
        if (!expanded) {
            this.#handleNodeLoad(eventKey, data);
        }
    }

    /**
     * Reports the blur once per focus: on a mousedown outside, a single pick that closes, or the focus leaving the
     * trigger and the dropdown (the component checks where it went)
     */
    #handleTriggerBlur(e: E | MouseEvent | FocusEvent) {
        if (!this.#blurPending) {
            return;
        }
        this.setState({ isFocus: false });
        this.#notifyBlur(e);
    }

    protected override initOnce() {
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

    /** The state that props imply, given the previous state; null when nothing changed (see `deriveTreeState`) */
    static deriveState(props: BasicTreeSelectProps, prevState: BasicTreeSelectInnerData): Partial<BasicTreeSelectInnerData> | null {
        return deriveTreeState(props, prevState, TreeSelectFoundation.propKeys);
    }

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

    /** The label a node shows as the selection or as a tag: the field keyMaps.label, else treeNodeLabelProp, names */
    static getNodeLabel(item: BasicTreeNodeData, { treeNodeLabelProp, keyMaps }: Pick<BasicTreeSelectProps, 'treeNodeLabelProp' | 'keyMaps'>): unknown {
        return get(item, keyMaps?.label ?? treeNodeLabelProp, null);
    }

    /** What the trigger shows for the single selection; pure, so render can call it */
    static getRenderTextInSingle(props: Record<string, any>, { selectedKeys, keyEntities }: Pick<BasicTreeSelectInnerData, 'selectedKeys' | 'keyEntities'>) {
        const { renderSelectedItem } = props;
        const item = selectedKeys.length ? getNodeData(selectedKeys[0], keyEntities, props) : null;
        if (!item) {
            return null;
        }
        return typeof renderSelectedItem === 'function' ? renderSelectedItem(item) : TreeSelectFoundation.getNodeLabel(item, props);
    }

    /** Whether a selected key's tag can be closed: not while the TreeSelect or its node is disabled, nor for a key in disabledKeys under disableStrictly */
    static isTagClosable(key: string, props: Pick<BasicTreeSelectProps, 'disabled' | 'disableStrictly' | 'keyMaps' | 'onChangeWithObject' | 'value' | 'defaultValue' | 'treeNodeLabelProp'>, { keyEntities, disabledKeys }: Pick<BasicTreeSelectInnerData, 'keyEntities' | 'disabledKeys'>) {
        const item = getNodeData(key, keyEntities, props);
        return Boolean(item) && !props.disabled && !item[props.keyMaps?.disabled ?? 'disabled'] && !(props.disableStrictly && disabledKeys.has(key));
    }

    /** Writes the state derived from new props back, so handlers read what was rendered */
    syncDerivedState = (derived: Partial<BasicTreeSelectInnerData>) => {
        this.setState(derived as S);
    };

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
     * The focus left the trigger and the dropdown (the component checks where it went): reports the blur, and closes
     * an open dropdown when the focus went to another element (APG combobox). A window blur has no target and keeps
     * the dropdown, as the native select does.
     */
    handleFocusLeave = (e: FocusEvent) => {
        this.#handleTriggerBlur(e);
        if (e.relatedTarget && this.getState('isOpen')) {
            this.close();
        }
    };

    /** A mousedown outside the trigger and the dropdown, listened to while the TreeSelect is focused or open */
    handleClickOutside = (e: MouseEvent) => {
        this.#handleTriggerBlur(e);
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
                this.adapter.focusTrigger();
                this.close();
            }
        }
    };

    onClickSingleTriggerSearchItem = () => {
        this.#focusInput();
    };

    close = () => {
        this.setState({ isOpen: false });
        this.adapter.notifyVisibleChange(false);
        if (this.getProp('motionExpand')) {
            this.setState({ motionKeys: new Set([]) });
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
        const isControlled = this.isControlledComponent();
        const value: string | string[] | undefined = this.#isMultiple() ? [] : undefined;
        const hasValue = TreeSelectFoundation.hasValue(this.getProps(), this.getStates());
        // the clear button also shows for search text alone; that clears no value
        if (hasValue) {
            this.#notifyChange(value, e);
        }
        if (hasValue && !isControlled) {
            this.setState(getClearedSelection() as S);
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
        this.adapter.notifyClear(e);
    };

    removeTag = (eventKey: BasicTreeNodeData['key']) => {
        const props = this.getProps();
        const { disableStrictly, checkRelation } = props;
        const state = this.getStates();
        const { keyEntities, realCheckedKeys } = state;
        if (!TreeSelectFoundation.isTagClosable(eventKey, props, state)) {
            return;
        }
        const item = getNodeData(eventKey, keyEntities, props);
        if (checkRelation === 'unRelated') {
            const newRealCheckedKeys = new Set(realCheckedKeys);
            newRealCheckedKeys.delete(eventKey);
            this.#notifyChange([...newRealCheckedKeys], null);
            if (!this.isControlledComponent()) {
                this.setState({ realCheckedKeys: newRealCheckedKeys });
            }
        } else if (checkRelation === 'related') {
            // like unchecking the node in the tree: disableStrictly keeps the checked state of disabled descendants
            const { checkedKeys, halfCheckedKeys } = calcRelatedCheckedKeys(eventKey, false, disableStrictly, state);
            this.#notifyChange([...checkedKeys], null);
            if (!this.isControlledComponent()) {
                this.setState({ checkedKeys, halfCheckedKeys });
            }
        }

        this.adapter.notifySelect(eventKey, false, item);
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
        this.setState({ cachedFlattenNodes: motionType === 'hide' && this.#isAnimated() ? this.getState('flattenNodes') : undefined });

        if (!isExpandControlled) {
            const flattenNodes = flattenTreeData(treeData, expandedKeys, keyMaps);
            const motionKeys = this.#isAnimated() ? getMotionKeys(eventKey, expandedKeys, keyEntities) : [];
            const newState = {
                expandedKeys,
                flattenNodes,
                motionKeys: new Set(motionKeys),
                motionType,
            };
            this.setState(newState);
        }

        this.adapter.notifyExpand(expandedKeys, {
            expanded: !expanded,
            node: data,
        });
        if (!expanded) {
            this.#handleNodeLoad(eventKey, data);
        }
    };

    // Focus moving between the trigger's search input and the clear button stays inside; it must not clear the text
    handleInputTriggerBlur = (e?: { relatedTarget: EventTarget | null }) => {
        if (this.adapter.isInTrigger(e?.relatedTarget)) {
            return;
        }
        this.setState({ inputTriggerFocus: false });
    };

    handleInputTriggerFocus = (e?: { relatedTarget: EventTarget | null }) => {
        if (this.adapter.isInTrigger(e?.relatedTarget)) {
            return;
        }
        this.#clearInput();
        this.setState({ inputTriggerFocus: true });
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
