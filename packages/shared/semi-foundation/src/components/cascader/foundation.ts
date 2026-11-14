import { isEqual } from 'es-toolkit';
import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { calcCheckedStatus, calcRelatedCheckedKeys } from '../tree/shared';
import { findAncestorKeys, calcCheckedKeys, calcDisabledKeys, normalizeKeyList, normalizedArr } from '../tree/tree-util';
import { strings } from './constants';
import { type KeyMapProps, filter, getColumns, convertDataToEntities, calcMergeType, getKeyByValuePath, getKeysByValuePath, getKeyByPos, getValueOrKey } from './util';

export type { KeyMapProps };
import { getListTargetIndex, isBrowserChord, isInnerControlActivation, isTextEditor, Typeahead, isEnterPress, isObject, ESC_KEY, type Size } from '../../utils/index';

export interface BasicData {
    data: BasicCascaderData;
    disabled: boolean;
    key: string;
    searchText: any[];
    pathData?: BasicCascaderData[];
}

export interface Virtualize {
    itemSize: number;
    height?: number;
    width?: number | string;
}

export interface BasicEntities {
    [idx: string]: BasicEntity;
}

export interface BasicEntity {
    children?: Array<BasicEntity>;
    data: BasicCascaderData;
    ind: number;
    key: string;
    level: number;
    parent?: BasicEntity;
    parentKey?: string;
    path: Array<string>;
    pos: string;
    valuePath: Array<string>;
}

export interface BasicCascaderData {
    [x: string]: any;
    value: string | number;
    label: any;
    disabled?: boolean;
    isLeaf?: boolean;
    loading?: boolean;
    children?: BasicCascaderData[];
}

export type CascaderType = Size;

export type BasicSimpleValueType = string | number | BasicCascaderData;

export type BasicValue = BasicSimpleValueType | Array<BasicSimpleValueType> | Array<Array<BasicSimpleValueType>>;

export type ShowNextType = 'click' | 'hover';

export interface BasicTriggerRenderProps {
    componentProps: BasicCascaderProps;
    disabled: boolean;
    /**
     * The tree position of the selected node, e.g. 0-0-1
     */
    value?: string | Set<string>;
    /**
     * The search text while open; the selected path text (displayRender may return a node) while closed.
     * `any` keeps foundation free of React types; semi-ui-react declares it as `React.ReactNode`.
     */
    inputValue: any;
    placeholder?: string;
    /**
     * Call it when the Input customized by triggerRender updates, to sync the state with Cascader.
     */
    onSearch: (inputValue: string) => void;
    onClear: (e: any) => void;
    onRemove: (key: string) => void;
}

export interface BasicScrollPanelProps {
    panelIndex: number;
    activeNode: BasicCascaderData;
}

export interface BasicCascaderProps {
    borderless?: boolean;
    separator?: string;
    arrowIcon?: any;
    changeOnSelect?: boolean;
    multiple?: boolean;
    autoMergeValue?: boolean;
    defaultValue?: BasicValue;
    disabled?: boolean;
    emptyContent?: any;
    filterLeafOnly?: boolean;
    motion?: boolean;
    filterTreeNode?: ((inputValue: string, treeNodeString: string, data?: BasicCascaderData) => boolean) | boolean;
    /** `first` and `second` are the two result paths, from the root to the matched node */
    filterSorter?: (first: BasicCascaderData[], second: BasicCascaderData[], inputValue: string) => number;
    filterRender?: (props: any) => any;
    placeholder?: string;
    searchPlaceholder?: string;
    size?: CascaderType;
    className?: string;
    treeData?: Array<BasicCascaderData>;
    treeNodeFilterProp?: string;
    displayProp?: string;
    maxTagCount?: number;
    max?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: any;
    children?: any;
    value?: BasicValue;
    prefix?: any;
    suffix?: any;
    insetLabel?: any;
    style?: any;
    stopPropagation?: boolean | string;
    showClear?: boolean;
    autoAdjustOverflow?: boolean;
    defaultOpen?: boolean;
    onChangeWithObject?: boolean;
    bottomSlot?: any;
    topSlot?: any;
    showNext?: ShowNextType;
    disableStrictly?: boolean;
    leafOnly?: boolean;
    enableLeafClick?: boolean;
    clickToSelect?: boolean;
    preventScroll?: boolean;
    virtualizeInSearch?: Virtualize;
    checkRelation?: typeof strings.RELATED | typeof strings.UN_RELATED;
    searchPosition?: typeof strings.SEARCH_POSITION_TRIGGER | typeof strings.SEARCH_POSITION_CUSTOM;
    remote?: boolean;
    keyMaps?: KeyMapProps;
    onClear?: () => void;
    triggerRender?: (props: BasicTriggerRenderProps) => any;
    onListScroll?: (e: any, panel: BasicScrollPanelProps) => void;
    loadData?: (selectOptions: BasicCascaderData[]) => Promise<void>;
    onLoad?: (newLoadedKeys: Set<string>, data: BasicCascaderData) => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
    onChange?: (value: BasicValue) => void;
    onSearch?: (value: string) => void;
    onSelect?: (value: string | number | Array<string | number>) => void;
    onExceed?: (checkedItem: BasicEntity[]) => void;
    displayRender?: (selected: Array<string> | BasicEntity, idx?: number) => any;
    onBlur?: (e: any) => void;
    onFocus?: (e: any) => void;
}

export interface BasicCheckedState {
    checkedKeys: Set<string>;
    halfCheckedKeys: Set<string>;
    resolvedCheckedKeys: Set<string>;
}

export interface BasicCascaderInnerData {
    isOpen: boolean;
    /** unused in multiple mode: `getStates()` and render derive it from treeData and keyMaps */
    keyEntities: BasicEntities;
    selectedKeys: Set<string>;
    activeKeys: Set<string>;
    /** the option the arrow keys are on; null until one moves, and after closing or a new search */
    keyboardKey: string | null;
    filteredKeys: Set<string>;
    inputValue: string;
    isSearching: boolean;
    /** multiple mode: stored when uncontrolled, derived from `value` when controlled */
    checkedKeys: Set<string>;
    halfCheckedKeys: Set<string>;
    resolvedCheckedKeys: Set<string>;
    /** the keyEntities the stored checked sets were computed against; others recompute them */
    checkedEntities?: BasicEntities;
    loadedKeys: Set<string>;
    loadingKeys: Set<string>;
    disabledKeys: Set<string>;
    showInput?: boolean;
}

/**
 * E is the host's click or key event, passed to onFocus and onBlur (a mousedown outside closes with the native
 * MouseEvent); LE is the host's list scroll event, passed to onListScroll
 */
export interface CascaderAdapter<E = unknown, LE = unknown> extends DefaultAdapter<BasicCascaderProps, BasicCascaderInnerData> {
    notifyClear: () => void;
    focusCombobox: () => void;
    blurCombobox: () => void;
    notifyChange: (value: BasicValue) => void;
    notifySelect: (selected: string | number | Array<string | number>) => void;
    notifyOnSearch: (input: string) => void;
    notifyFocus: (e: E | FocusEvent) => void;
    notifyBlur: (e?: E | MouseEvent | FocusEvent) => void;
    notifyDropdownVisibleChange: (visible: boolean) => void;
    notifyOnLoad: (newLoadedKeys: Set<string>, data: BasicCascaderData) => void;
    notifyListScroll: (e: LE, panel: BasicScrollPanelProps) => void;
    notifyOnExceed: (data: BasicEntity[]) => void;
    /** `index` is the option's place in its column or in the search results */
    scrollToOption: (key: string, index: number) => void;
}

// Render and foundation derive the same multiple-mode values; entries are never mutated, so instances sharing a
// treeData can share them.
const keyEntitiesCache = new WeakMap<object, { keyMaps?: KeyMapProps; keyEntities: BasicEntities }>();
const disabledKeysCache = new WeakMap<BasicEntities, Set<string>>();
const checkedStateCache = new WeakMap<BasicEntities, { inputs: unknown[]; result: BasicCheckedState }>();

type MultipleView = Pick<BasicCascaderInnerData, 'keyEntities' | 'checkedKeys' | 'halfCheckedKeys' | 'resolvedCheckedKeys' | 'disabledKeys'>;
const DERIVED_STATE_KEYS = new Set<keyof BasicCascaderInnerData>(['keyEntities', 'checkedKeys', 'halfCheckedKeys', 'resolvedCheckedKeys', 'disabledKeys']);

interface TreeItemState {
    selected: boolean;
    loading: boolean;
    showActive: boolean;
    showSelected: boolean;
    aria: {
        'aria-busy': boolean | undefined;
        'aria-checked': boolean | 'mixed' | undefined;
        'aria-expanded': boolean | undefined;
        'aria-selected': boolean | undefined;
    };
}

export default class CascaderFoundation<E = unknown, LE = unknown> extends BaseFoundation<CascaderAdapter<E, LE>, BasicCascaderProps, BasicCascaderInnerData> {
    // Entities standing in for a selected value treeData lacks: their path holds values, not keys. Kept by identity,
    // since the hosts store keyEntities without copying entities, so that Entity carries no flag of its own
    static readonly #missingEntities = new WeakSet<BasicEntity>();
    // whether onBlur is owed for the focus now inside the component
    #blurPending = false;
    readonly #typeahead = new Typeahead();
    // by content: an inline treeData or value is a new array on every parent render, and each change resets the search
    static override readonly propKeys = ['treeData', 'keyMaps', 'value'] as const satisfies readonly (keyof BasicCascaderProps)[];
    static override readonly propEquals = { treeData: isEqual, keyMaps: isEqual, value: isEqual };

    static #getFilteredData({ treeNodeFilterProp, filterSorter, keyMaps }: BasicCascaderProps, { filteredKeys, keyEntities, inputValue }: BasicCascaderInnerData) {
        const realFilterProp = treeNodeFilterProp !== 'label' ? treeNodeFilterProp : (keyMaps?.label ?? 'label');
        const filteredList: Array<BasicData & { pathData: BasicCascaderData[] }> = [];
        filteredKeys.forEach((key) => {
            const item = keyEntities[key];
            if (!item) {
                return;
            }
            const pathData = CascaderFoundation.getItemPropPath(key, [], keyEntities);
            const itemSearchPath = pathData.map((pathItem) => pathItem[realFilterProp]);
            const isDisabled = findAncestorKeys([key], keyEntities, true).some((ancestorKey) => keyEntities[ancestorKey].data.disabled);
            filteredList.push({
                data: item.data,
                pathData,
                key,
                disabled: isDisabled,
                searchText: itemSearchPath,
            });
        });

        return typeof filterSorter === 'function' ? filteredList.toSorted((a, b) => filterSorter(a.pathData, b.pathData, inputValue)) : filteredList;
    }

    /** Each path of a multiple-mode value, with the key it points at (undefined for an empty path) */
    static #valuePaths(value: BasicValue, { onChangeWithObject, keyMaps }: BasicCascaderProps) {
        let normalizedValue: BasicSimpleValueType[][] = [];
        if (Array.isArray(value)) {
            normalizedValue = Array.isArray(value[0]) ? (value as BasicSimpleValueType[][]) : ([value] as BasicSimpleValueType[][]);
        } else if (value !== undefined) {
            normalizedValue = [[value]];
        }
        return normalizedValue.map((path) => {
            const valuePath = onChangeWithObject && isObject(path[0]) ? getValueOrKey(path, keyMaps) : (path as (string | number)[]);
            return { path, key: valuePath.length > 0 ? getKeyByValuePath(valuePath) : undefined };
        });
    }

    /**
     * The paths of a controlled multiple value that the current treeData lacks (a remote search, unloaded nodes).
     * They are the owner's data, so a change keeps them, max counts them, and the clear button removes them.
     */
    static #missingValuePaths(props: BasicCascaderProps, keyEntities: BasicEntities) {
        if (props.value === undefined) {
            return [];
        }
        return CascaderFoundation.#valuePaths(props.value, props)
            .filter(({ key }) => key !== undefined && !keyEntities[key])
            .map(({ path }) => path);
    }

    static #selectionFor(props: BasicCascaderProps, state: BasicCascaderInnerData, value: BasicValue, keyEntities: BasicEntities) {
        const { changeOnSelect, onChangeWithObject, keyMaps, loadData, multiple } = props;
        const { activeKeys, loadingKeys, loadedKeys, keyEntities: keyEntityState, selectedKeys: selectedKeysState } = state;
        const filterable = Boolean(props.filterTreeNode);
        // filterLeafOnly=false lets a search result pick a branch, so a controlled value echoing it back stays selected
        const branchSelectable = changeOnSelect || (filterable && props.filterLeafOnly === false);
        // The treeData update a load causes keeps the selection and the open columns. It may land before the load
        // settles (the key is still loading) or after it (the loaded key has just gained children), so both count
        const isLoading = (key: string) => loadingKeys.has(key) || (loadedKeys.has(key) && !keyEntityState[key]?.children && Boolean(keyEntities[key]?.children));
        const loadingActive = [...activeKeys].some(isLoading);
        const normalizedValue = normalizedArr(value);
        const valuePath = onChangeWithObject && isObject(normalizedValue[0]) ? getValueOrKey(normalizedValue, keyMaps) : normalizedValue;
        const selectedKeys = getKeysByValuePath(valuePath);
        let updateStates: Partial<BasicCascaderInnerData> = {};

        const selectedKey = selectedKeys.length > 0 ? selectedKeys[0] : undefined;
        const selectedItem = selectedKey ? keyEntities[selectedKey] : undefined;
        if (selectedItem) {
            /**
             * Selected even when disabled
             */
            if (branchSelectable || CascaderFoundation.#isLeafData(selectedItem.data, loadData)) {
                updateStates.selectedKeys = new Set([selectedKey]);
                if (!loadingActive) {
                    updateStates.activeKeys = new Set(selectedItem.path);
                }
                /**
                 * A path ending at a branch selects nothing unless branches are selectable (a selected leaf that treeData turns
                 * into a branch, a controlled value pointing at a branch). Cleared only while something is selected:
                 * clearing again would empty the search text and activeKeys on each treeData update of a remote
                 * search or loadData
                 */
            } else if (selectedKeysState.size) {
                updateStates = CascaderFoundation.#clearedSelection(filterable, multiple);
            }
        } else if ((Array.isArray(value) || typeof value === 'string') && value.length) {
            const val = valuePath.at(-1);
            const key = `not-exist-${val}`;
            const optionNotExist = {
                data: {
                    label: val,
                    value: val,
                },
                key,
                path: valuePath,
            } as BasicEntity;
            CascaderFoundation.#missingEntities.add(optionNotExist);
            updateStates.selectedKeys = new Set([key]);
            // a copy: keyEntities may be the state's own object
            keyEntities = { ...keyEntities, [key]: optionNotExist };
        } else if ([...loadingKeys, ...loadedKeys].some(isLoading)) {
            // async loading updates treeData: keep the selection and merge, since overwriting the 'not-exist-*'
            // entities would empty selectionContent when a dropdown item is clicked
            updateStates.keyEntities = { ...keyEntityState, ...keyEntities };
            return { updateStates, keyEntities };
        } else {
            updateStates = CascaderFoundation.#clearedSelection(filterable, multiple);
        }
        updateStates.keyEntities = keyEntities;
        return { updateStates, keyEntities };
    }

    static #clearedSelection(filterable: boolean, multiple: boolean) {
        const updateStates: Partial<BasicCascaderInnerData> = {};
        updateStates.selectedKeys = new Set([]);
        updateStates.activeKeys = new Set([]);
        updateStates.filteredKeys = new Set([]);
        if (filterable && !multiple) {
            updateStates.inputValue = '';
        }
        return updateStates;
    }

    static #isLeafData(item: BasicCascaderData, loadData: BasicCascaderProps['loadData']) {
        if (loadData) {
            return Boolean(item.isLeaf);
        }
        return !item.children || !item.children.length;
    }

    static #resolveCheckedKeys(checkedKeys: Set<string>, keyEntities: BasicEntities, { autoMergeValue, leafOnly }: BasicCascaderProps) {
        return new Set(normalizeKeyList(checkedKeys, keyEntities, calcMergeType(autoMergeValue, leafOnly) === strings.LEAF_ONLY_MERGE_TYPE));
    }

    #isDisabled() {
        return this.getProp('disabled');
    }

    #isFilterable() {
        return Boolean(this.getProp('filterTreeNode'));
    }

    #notifySingleChange(item: BasicEntity | BasicData) {
        const valueProp = this.getProp('onChangeWithObject') ? [] : 'value';
        this.adapter.notifyChange(this.getItemPropPath(item.key, valueProp));
    }

    #notifyMultipleChange(checkedKeys: Set<string>) {
        const valueProp = this.getProp('onChangeWithObject') ? [] : 'value';
        const keyEntities = this.getState('keyEntities');
        const paths = [...checkedKeys].map((checkedKey) => this.getItemPropPath(checkedKey, valueProp, keyEntities));
        this.adapter.notifyChange([...CascaderFoundation.#missingValuePaths(this.getProps(), keyEntities), ...paths]);
    }

    #isLeaf(item: BasicCascaderData) {
        return CascaderFoundation.#isLeafData(item, this.getProp('loadData'));
    }

    #clearInput() {
        this.setState({ inputValue: '' });
    }

    #notifyBlur(e?: E | MouseEvent | FocusEvent) {
        if (!this.#blurPending) {
            return;
        }
        this.#blurPending = false;
        this.adapter.notifyBlur(e);
    }

    /** A single pick closes the dropdown and reports the blur at once, so a Form with trigger="blur" validates */
    #closeAfterPick(e: E, key?: string) {
        this.#close(key);
        this.#notifyBlur(e);
    }

    #close(key?: string) {
        const { multiple } = this.getProps();
        this.setState({ isOpen: false, keyboardKey: null });
        this.adapter.notifyDropdownVisibleChange(false);
        if (this.#isFilterable()) {
            const { selectedKeys } = this.getStates();
            let inputValue = '';
            if (key && !multiple) {
                inputValue = this.renderDisplayText(key);
            } else if (selectedKeys.size && !multiple) {
                inputValue = this.renderDisplayText([...selectedKeys][0]);
            }
            // reset isSearching here, not in afterClose: open() clears inputValue while isSearching could still be true
            this.setState({ inputValue, isSearching: false });
            if (!multiple) {
                this.#toggle2SearchInput(false);
            }
        }
    }

    #notifyFocus(e: E | FocusEvent) {
        if (!this.#blurPending && !this.#isDisabled()) {
            this.#blurPending = true;
            this.adapter.notifyFocus(e);
        }
    }

    #getCacheValue(keyEntities: BasicEntities) {
        const { selectedKeys, keyEntities: prevKeyEntities } = this.getStates();
        const selectedKey = Array.from(selectedKeys)[0];
        // previous entities keep the value path of a selection treeData dropped, so it resolves again when it returns;
        // a key is never parsed back into values since they may contain the separator or spaces
        const entity = keyEntities[selectedKey] ?? prevKeyEntities[selectedKey];
        if (!entity) {
            return undefined;
        }
        return CascaderFoundation.#missingEntities.has(entity) ? entity.path : entity.valuePath;
    }

    #calcFilteredKeys(sugInput: string, keyEntities?: BasicEntities) {
        if (!sugInput) {
            return [];
        }
        const { treeNodeFilterProp, filterTreeNode, filterLeafOnly, remote, keyMaps } = this.getProps();
        const realFilterProp = treeNodeFilterProp !== 'label' ? treeNodeFilterProp : (keyMaps?.label ?? 'label');
        keyEntities ??= this.getState('keyEntities');
        const entities = Object.values(keyEntities).filter((item) => !CascaderFoundation.#missingEntities.has(item));

        if (remote) {
            return entities.filter((item) => (filterTreeNode && !filterLeafOnly) || this.#isLeaf(item.data)).map((item) => item.key);
        }

        return entities
            .filter(({ key, data }) => {
                const filteredPath = this.getItemPropPath(key, realFilterProp, keyEntities);
                return filter(sugInput, data, filterTreeNode, filteredPath);
            })
            .filter((item) => (filterTreeNode && !filterLeafOnly) || this.#isLeaf(item.data))
            .map((item) => item.key);
    }

    #defaultRenderText(path: any[], displayRender?: BasicCascaderProps['displayRender']) {
        const separator = this.getProp('separator');
        if (displayRender && typeof displayRender === 'function') {
            return displayRender(path);
        }
        // a React element label has no text form; joining it would show "[object Object]"
        return path.every((item) => typeof item === 'string' || typeof item === 'number') ? path.join(separator) : '';
    }

    #handleMultipleSelect(item: BasicEntity | BasicData) {
        const { checkRelation, searchPosition } = this.getProps();
        if (checkRelation === strings.RELATED) {
            this.#handleRelatedMultipleSelect(item);
        } else if (checkRelation === strings.UN_RELATED) {
            this.#handleUnRelatedMultipleSelect(item);
        }
        // not just the text: the list leaves the search results too, and onSearch hears the cleared keyword; a custom
        // search box belongs to the owner, who drives its keyword
        if (searchPosition === strings.SEARCH_POSITION_TRIGGER && this.getState('inputValue') !== '') {
            this.handleInputChange('');
        }
    }

    #handleRelatedMultipleSelect({ key }: BasicEntity | BasicData) {
        const props = this.getProps();
        const states = this.getStates();
        const { checkedKeys, keyEntities } = states;
        const { max, disableStrictly } = props;
        const missingCount = CascaderFoundation.#missingValuePaths(props, keyEntities).length;
        const prevCheckedStatus = checkedKeys.has(key);
        const curCheckedStatus = disableStrictly ? calcCheckedStatus(!prevCheckedStatus, key, states) : !prevCheckedStatus;
        const { checkedKeys: curCheckedKeys, halfCheckedKeys: curHalfCheckedKeys } = calcRelatedCheckedKeys(key, curCheckedStatus, disableStrictly, states);
        const curResolvedCheckedKeys = CascaderFoundation.#resolveCheckedKeys(curCheckedKeys, keyEntities, props);
        const curRealCheckedKeys = CascaderFoundation.getTriggerKeys(props, { checkedKeys: curCheckedKeys, resolvedCheckedKeys: curResolvedCheckedKeys });

        // past max, the selection may shrink but not grow
        if (typeof max === 'number' && CascaderFoundation.getTriggerKeys(props, states).size < curRealCheckedKeys.size && curRealCheckedKeys.size + missingCount > max) {
            this.adapter.notifyOnExceed([...curRealCheckedKeys].map((itemKey) => keyEntities[itemKey]));
            return;
        }
        if (!this.isControlledComponent()) {
            this.setState({
                checkedKeys: curCheckedKeys,
                halfCheckedKeys: curHalfCheckedKeys,
                resolvedCheckedKeys: curResolvedCheckedKeys,
                checkedEntities: keyEntities,
            });
        }

        this.#notifyMultipleChange(curRealCheckedKeys);

        if (curCheckedStatus) {
            this.#notifySelect(curRealCheckedKeys);
        }
    }

    #handleUnRelatedMultipleSelect({ key }: BasicEntity | BasicData) {
        const { checkedKeys, keyEntities } = this.getStates();
        const { max } = this.getProps();
        const newCheckedKeys: Set<string> = new Set(checkedKeys);
        let targetStatus: boolean;
        const prevCheckedStatus = checkedKeys.has(key);
        if (prevCheckedStatus) {
            newCheckedKeys.delete(key);
            targetStatus = false;
        } else {
            if (typeof max === 'number') {
                if (checkedKeys.size + CascaderFoundation.#missingValuePaths(this.getProps(), keyEntities).length >= max) {
                    const checkedEntities: BasicEntity[] = [];
                    checkedKeys.forEach((itemKey) => {
                        checkedEntities.push(keyEntities[itemKey]);
                    });
                    this.adapter.notifyOnExceed(checkedEntities);
                    return;
                }
            }
            newCheckedKeys.add(key);
            targetStatus = true;
        }
        if (!this.isControlledComponent()) {
            this.setState({
                checkedKeys: newCheckedKeys,
                checkedEntities: keyEntities,
            });
        }

        this.#notifyMultipleChange(newCheckedKeys);

        if (targetStatus) {
            this.#notifySelect(newCheckedKeys);
        }
    }

    #notifySelect(keys: Set<string>) {
        const { keyEntities } = this.getStates();
        const values: (string | number)[] = [];
        keys.forEach((key) => {
            const valueItem = keyEntities[key]?.data?.value;
            if (valueItem !== undefined) {
                values.push(valueItem);
            }
        });
        const formatValue: number | string | Array<string | number> = values.length === 1 ? values[0] : values;
        this.adapter.notifySelect(formatValue);
    }

    #toggle2SearchInput(isShow: boolean) {
        // read first: a pick reports the blur right after closing. Unmounting the focused search input would drop the
        // focus to the body, so the trigger, the combobox again, takes it back
        const focusInside = this.#blurPending;
        this.setState({ showInput: isShow }, () => {
            if (isShow || focusInside) {
                this.focus();
            }
        });
    }

    #handleShowNextByHover(item: BasicEntity) {
        const { keyEntities } = this.getStates();
        const { data, key } = item;
        const isLeaf = this.#isLeaf(data);
        const activeKeys = keyEntities[key].path;
        this.setState({
            activeKeys: new Set(activeKeys),
        });
        if (!isLeaf) {
            this.#notifyIfLoadData(item);
        }
    }

    #handleNodeLoad({ data, key }: BasicEntity | BasicData) {
        const newLoadedKeys = new Set(this.getState('loadedKeys')).add(key);
        const newLoadingKeys = new Set(this.getState('loadingKeys'));
        newLoadingKeys.delete(key);

        // onLoad before the internal setState, or loadData triggers twice
        this.adapter.notifyOnLoad(newLoadedKeys, data);
        this.setState({
            loadingKeys: newLoadingKeys,
            loadedKeys: newLoadedKeys,
        });
    }

    #notifyIfLoadData(item: BasicEntity | BasicData) {
        const { data, key } = item;
        const { loadData } = this.getProps();
        if (!data.isLeaf && !data.children && loadData) {
            const { loadedKeys, loadingKeys, keyEntities } = this.getStates();
            if (loadedKeys.has(key) || loadingKeys.has(key)) {
                return;
            }
            const optionPath = this.getItemPropPath(key, [], keyEntities);
            this.setState({ loadingKeys: new Set(loadingKeys).add(key) });
            // a thenable settles only through the callbacks its then is given
            void Promise.resolve(loadData(optionPath))
                .then(() => this.#handleNodeLoad(item))
                // on rejection too, so the option can be retried; the rejection still reaches the caller
                .finally(() => this.#clearLoading(key));
        }
    }

    #clearLoading(key: string) {
        const loadingKeys = this.getState('loadingKeys');
        if (loadingKeys.has(key)) {
            const newLoadingKeys = new Set(loadingKeys);
            newLoadingKeys.delete(key);
            this.setState({ loadingKeys: newLoadingKeys });
        }
    }

    #handleSingleSelect(e: E, item: BasicEntity | BasicData) {
        const { changeOnSelect: allowChange, filterLeafOnly, multiple, enableLeafClick, clickToSelect } = this.getProps();
        const { keyEntities, selectedKeys, isSearching } = this.getStates();
        const { data, key } = item;

        const isLeaf = this.#isLeaf(data);

        const activeKeys = keyEntities[key].path;
        const selectedKey = [key];
        const hasChanged = key !== [...selectedKeys][0];

        if (!isLeaf && !allowChange && !isSearching && !(multiple && clickToSelect)) {
            this.setState({ activeKeys: new Set(activeKeys) });
            this.#notifyIfLoadData(item);
            return;
        }
        if (multiple) {
            this.setState({ activeKeys: new Set(activeKeys) });
            if (clickToSelect || (isLeaf && enableLeafClick)) {
                this.onItemCheckboxClick(item);
            }
        } else {
            this.adapter.notifySelect(data.value);
            if (hasChanged) {
                this.#notifySingleChange(item);
                this.#notifyIfLoadData(item);
                if (this.isControlledComponent()) {
                    this.setState({ activeKeys: new Set(activeKeys) });
                    if (isLeaf || (!filterLeafOnly && isSearching)) {
                        this.#closeAfterPick(e);
                    }
                    return;
                }

                this.setState({
                    activeKeys: new Set(activeKeys),
                    selectedKeys: new Set(selectedKey),
                });

                if (isLeaf || (!filterLeafOnly && isSearching)) {
                    this.#closeAfterPick(e, key);
                }
            } else {
                this.#closeAfterPick(e);
            }
        }
    }

    #updateSelectedKey(value: BasicValue, keyEntities: BasicEntities) {
        const selection = CascaderFoundation.#selectionFor(this.getProps(), this.getStates(), value, keyEntities);
        this.setState(selection.updateStates as BasicCascaderInnerData);
        return selection.keyEntities;
    }

    #reCalcActiveKeys() {
        const { selectedKeys, activeKeys, keyEntities } = this.getStates();
        const selectedKey = [...selectedKeys][0];
        const selectedItem = keyEntities[selectedKey];
        if (!selectedItem) {
            return;
        }
        const newActiveKeys: Set<string> = new Set(selectedItem.path);
        if (!isEqual(newActiveKeys, activeKeys)) {
            this.setState({
                activeKeys: newActiveKeys,
            });
        }
    }

    /** Right (`into`) and Left on an option of the columns */
    #handleColumnKey(option: BasicEntity, into: boolean) {
        const { activeKeys } = this.getStates();
        const isOpen = activeKeys.has(option.key) && CascaderFoundation.isBranch(option.data, this.getProp('loadData'));
        if (into) {
            if (!isOpen) {
                if (!this.#isOptionDisabled(option)) {
                    this.#handleShowNextByHover(option);
                }
            } else if (option.children?.length) {
                this.#moveTo(option.children[0].key, 0);
            }
        } else if (isOpen) {
            this.setState({ activeKeys: new Set(option.path.slice(0, -1)) });
        } else if (option.parent) {
            const { parent } = option;
            const column = parent.parent ? parent.parent.children : CascaderFoundation.getRenderData(this.getProps(), this.getStates());
            this.#moveTo(
                parent.key,
                column.findIndex((item) => item.key === parent.key)
            );
        }
    }

    #moveTo(key: string, index: number) {
        this.setState({ keyboardKey: key });
        this.adapter.scrollToOption(key, index);
    }

    #getShownOptions() {
        const { activeKeys } = this.getStates();
        const topLevel = CascaderFoundation.getRenderData(this.getProps(), this.getStates()) as BasicEntity[];
        return getColumns(topLevel, activeKeys).flatMap(({ items }) => items.map((option, index) => ({ option, index })));
    }

    #isOptionDisabled(option: BasicEntity | BasicData) {
        return Boolean(option.data.disabled || ('disabled' in option && option.disabled));
    }

    #collectOptions() {
        const { treeData, value, keyMaps } = this.getProps();
        // read before updateSelectedKey, which may clear inputValue
        const { isSearching, inputValue } = this.getStates();
        let keyEntities = convertDataToEntities(treeData, keyMaps);
        let cacheValue;
        if (Object.keys(keyEntities).length > 0) {
            cacheValue = this.#getCacheValue(keyEntities);
        }

        const selectedValue = !this.isControlledComponent() ? cacheValue : value === undefined ? [] : value;
        if (selectedValue != null) {
            keyEntities = this.#updateSelectedKey(selectedValue, keyEntities);
        } else {
            this.setState({ keyEntities });
        }

        // treeData may update while searching (remote search); stale filteredKeys would render an empty list
        this.#recalculateFilteredKeys(isSearching ? inputValue : undefined, keyEntities);
    }

    /**
     * Syncs filteredKeys with the latest keyEntities without triggering onSearch.
     */
    #recalculateFilteredKeys(input?: string, nextKeyEntities?: BasicEntities) {
        const isFilterable = this.#isFilterable();
        if (!isFilterable) {
            return;
        }

        // without explicit input, inputValue may be the selected label text, which must not force searching mode
        const currentIsSearching = this.getState('isSearching');
        if (input === undefined && !currentIsSearching) {
            return;
        }

        const sugInput = input === undefined ? this.getState('inputValue') : input;
        const filteredKeys = this.#calcFilteredKeys(sugInput, nextKeyEntities);
        const updateStates: Partial<BasicCascaderInnerData> = {
            isSearching: Boolean(sugInput),
            filteredKeys: new Set(filteredKeys),
        };
        // an explicit input is the user's search text, which updateSelectedKey may have cleared
        if (input !== undefined) {
            updateStates.inputValue = input;
        }
        if (nextKeyEntities) {
            updateStates.keyEntities = nextKeyEntities;
        }
        this.setState(updateStates as BasicCascaderInnerData);
    }

    #handleValueChange(value: BasicValue) {
        const { keyEntities } = this.getStates();
        this.#updateSelectedKey(value, keyEntities);
        // a controlled pick closes before the parent writes the value back, so the closed input text follows it here
        const { isOpen, selectedKeys } = this.getStates();
        if (this.#isFilterable() && !this.getProp('multiple') && !isOpen && selectedKeys.size) {
            this.setState({ inputValue: this.renderDisplayText([...selectedKeys][0]) });
        }
    }

    protected override initOnce() {
        if (this.getProp('defaultOpen') && !this.#isDisabled()) {
            this.open();
        }
    }

    protected getItemPropPath(selectedKey: string, prop: string | unknown[], keyEntities?: BasicEntities) {
        return CascaderFoundation.getItemPropPath(selectedKey, prop, keyEntities || this.getState('keyEntities'));
    }

    protected renderDisplayText(targetKey: string, keyEntities?: BasicEntities) {
        const renderFunc = this.getProp('displayRender');
        const displayProp = this.getProp('displayProp');
        const displayPath = this.getItemPropPath(targetKey, displayProp, keyEntities);
        return this.#defaultRenderText(displayPath, renderFunc);
    }

    /** keyEntities of a treeData, shared while treeData keeps its identity and keyMaps stays equal */
    static getKeyEntities(treeData?: BasicCascaderData[], keyMaps?: KeyMapProps): BasicEntities {
        if (!treeData) {
            return convertDataToEntities(treeData, keyMaps);
        }
        const cached = keyEntitiesCache.get(treeData);
        if (cached && isEqual(cached.keyMaps, keyMaps)) {
            return cached.keyEntities;
        }
        const keyEntities = convertDataToEntities(treeData, keyMaps);
        keyEntitiesCache.set(treeData, { keyMaps, keyEntities });
        return keyEntities;
    }

    /** Keys of the entities a multiple value points at; paths missing from keyEntities are dropped */
    static getRealKeys(value: BasicValue, keyEntities: BasicEntities, props: BasicCascaderProps) {
        return CascaderFoundation.#valuePaths(value, props)
            .map(({ key }) => key)
            .filter((key) => key !== undefined && keyEntities[key]);
    }

    /** Whether a multiple value holds anything to clear, counting the controlled paths treeData lacks */
    static hasMultipleValue(props: BasicCascaderProps, { checkedKeys, keyEntities }: Pick<BasicCascaderInnerData, 'checkedKeys' | 'keyEntities'>) {
        return checkedKeys.size > 0 || CascaderFoundation.#missingValuePaths(props, keyEntities).length > 0;
    }

    /** Whether the clear button shows: for search text, or for a value; multiple mode keeps no selectedKeys beyond the one getInitialState writes */
    static isClearable(props: BasicCascaderProps, state: Pick<BasicCascaderInnerData, 'inputValue' | 'selectedKeys' | 'checkedKeys' | 'keyEntities'>) {
        const hasValue = props.multiple ? CascaderFoundation.hasMultipleValue(props, state) : state.selectedKeys.size > 0;
        return Boolean(props.showClear) && !props.disabled && (Boolean(state.inputValue) || hasValue);
    }

    static calcCheckedState(keys: string[], keyEntities: BasicEntities, { checkRelation, autoMergeValue, leafOnly }: BasicCascaderProps): BasicCheckedState {
        if (checkRelation !== strings.RELATED) {
            return { checkedKeys: new Set(keys), halfCheckedKeys: new Set(), resolvedCheckedKeys: new Set() };
        }
        const calRes = calcCheckedKeys(keys, keyEntities);
        const checkedKeys: Set<string> = new Set(calRes.checkedKeys);
        return {
            checkedKeys,
            halfCheckedKeys: new Set(calRes.halfCheckedKeys),
            resolvedCheckedKeys: CascaderFoundation.#resolveCheckedKeys(checkedKeys, keyEntities, { autoMergeValue, leafOnly }),
        };
    }

    /** The checked keys the trigger shows and onChange reports: merged unless checkRelation is unRelated or nothing merges */
    static getTriggerKeys({ checkRelation, autoMergeValue, leafOnly }: BasicCascaderProps, { checkedKeys, resolvedCheckedKeys }: Pick<BasicCascaderInnerData, 'checkedKeys' | 'resolvedCheckedKeys'>) {
        return checkRelation === strings.UN_RELATED || calcMergeType(autoMergeValue, leafOnly) === strings.NONE_MERGE_TYPE ? checkedKeys : resolvedCheckedKeys;
    }

    /** Whether a checked key's tag can be closed: not while the Cascader or its option is disabled, nor for a key in disabledKeys under disableStrictly */
    static isTagClosable(key: string, { disabled, disableStrictly }: BasicCascaderProps, { keyEntities, disabledKeys }: Pick<BasicCascaderInnerData, 'keyEntities' | 'disabledKeys'>) {
        const entity = keyEntities[key];
        return Boolean(entity) && !disabled && !entity.data.disabled && !(disableStrictly && disabledKeys.has(key));
    }

    /**
     * The multiple-mode values that follow props: keyEntities, disabledKeys under disableStrictly, and the checked
     * sets (from `value` when controlled, else the stored ones recomputed when keyEntities changed). Stored keys that
     * treeData lacks (removed, or not loaded yet) are left out; the state keeps them until the next change, so
     * treeData that brings them first checks them.
     */
    static deriveMultipleState(props: BasicCascaderProps, state: BasicCascaderInnerData): MultipleView {
        const { treeData, keyMaps, checkRelation, disableStrictly, autoMergeValue, leafOnly, onChangeWithObject } = props;
        const keyEntities = CascaderFoundation.getKeyEntities(treeData, keyMaps);
        let disabledKeys: Set<string> = new Set();
        if (checkRelation === strings.RELATED && disableStrictly) {
            disabledKeys = disabledKeysCache.get(keyEntities);
            if (!disabledKeys) {
                disabledKeys = calcDisabledKeys(keyEntities, keyMaps);
                disabledKeysCache.set(keyEntities, disabledKeys);
            }
        }
        const controlled = props.value !== undefined;
        if (!controlled && state.checkedEntities === keyEntities) {
            const { checkedKeys, halfCheckedKeys, resolvedCheckedKeys } = state;
            return { keyEntities, disabledKeys, checkedKeys, halfCheckedKeys, resolvedCheckedKeys };
        }
        const source = controlled ? props.value : state.checkedKeys;
        const inputs = [controlled, source, checkRelation, autoMergeValue, leafOnly, onChangeWithObject];
        const cached = checkedStateCache.get(keyEntities);
        let checked = cached && isEqual(cached.inputs, inputs) ? cached.result : undefined;
        if (!checked) {
            const keys = controlled ? CascaderFoundation.getRealKeys(props.value, keyEntities, props) : [...state.checkedKeys].filter((key) => keyEntities[key]);
            checked = CascaderFoundation.calcCheckedState(keys, keyEntities, props);
            checkedStateCache.set(keyEntities, { inputs, result: checked });
        }
        return { keyEntities, disabledKeys, ...checked };
    }

    static getInitialState(props: BasicCascaderProps) {
        const state: BasicCascaderInnerData = {
            disabledKeys: new Set(),
            // init opens a defaultOpen popup, so that onDropdownVisibleChange hears it
            isOpen: false,
            keyEntities: {},
            selectedKeys: new Set([]),
            activeKeys: new Set([]),
            keyboardKey: null,
            filteredKeys: new Set([]),
            inputValue: '',
            isSearching: false,
            checkedKeys: new Set([]),
            halfCheckedKeys: new Set([]),
            resolvedCheckedKeys: new Set([]),
            loadedKeys: new Set(),
            loadingKeys: new Set(),
            showInput: false,
        };
        const keyEntities = convertDataToEntities(props.treeData, props.keyMaps);
        const selectedValue = props.value !== undefined ? props.value : props.defaultValue;
        if (selectedValue != null) {
            Object.assign(state, CascaderFoundation.#selectionFor(props, state, selectedValue, keyEntities).updateStates);
        } else {
            state.keyEntities = keyEntities;
        }
        if (props.multiple && props.value === undefined) {
            // kept unfiltered and without checkedEntities, so deriveMultipleState checks a path once treeData brings it
            const keys = CascaderFoundation.#valuePaths(props.defaultValue, props)
                .map(({ key }) => key)
                .filter((key) => key !== undefined);
            state.checkedKeys = new Set(keys);
        }
        return state;
    }

    static getRenderData(props: BasicCascaderProps, state: BasicCascaderInnerData): Array<BasicEntity | BasicData> {
        const { keyEntities, isSearching } = state;
        if (isSearching && Boolean(props.filterTreeNode)) {
            return CascaderFoundation.#getFilteredData(props, state);
        }
        return Object.values(keyEntities)
            .filter((item) => item.parentKey === null && !CascaderFoundation.#missingEntities.has(item))
            .sort((a, b) => a.ind - b.ind);
    }

    static isBranch(data: BasicCascaderData, loadData: unknown) {
        return Boolean(data.children?.length) || Boolean(loadData && !data.isLeaf);
    }

    /**
     * An option that is both active and selected shows only as selected, and in multiple mode selection is the
     * checkbox's, so the row is never marked selected.
     */
    static getTreeItemState(key: string, sets: Record<'activeKeys' | 'selectedKeys' | 'loadedKeys' | 'loadingKeys' | 'checkedKeys' | 'halfCheckedKeys', Set<string>>, multiple: boolean, expandable: boolean): TreeItemState {
        const active = sets.activeKeys.has(key);
        const selected = sets.selectedKeys.has(key);
        const loading = sets.loadingKeys.has(key) && !sets.loadedKeys.has(key);
        const checkState = sets.halfCheckedKeys.has(key) ? ('mixed' as const) : sets.checkedKeys.has(key);
        return {
            selected,
            loading,
            showActive: active && !selected,
            showSelected: selected && !multiple,
            aria: {
                'aria-busy': loading || undefined,
                'aria-checked': multiple ? checkState : undefined,
                'aria-expanded': expandable ? active : undefined,
                'aria-selected': multiple ? undefined : selected,
            },
        };
    }

    /** `keyboardKey` while its option is shown; hover or a click elsewhere can close its column */
    static getKeyboardKey({ keyboardKey, keyEntities, activeKeys, isSearching, filteredKeys }: BasicCascaderInnerData): string | null {
        const entity = keyEntities[keyboardKey];
        if (!entity) {
            return null;
        }
        const shown = isSearching ? filteredKeys.has(keyboardKey) : entity.path.slice(0, -1).every((key) => activeKeys.has(key));
        return shown ? keyboardKey : null;
    }

    static getItemPropPath(selectedKey: string, prop: string | unknown[], keyEntities: BasicEntities) {
        const selectedItem = keyEntities[selectedKey];
        let path = [];
        if (!selectedItem) {
            // do nothing
        } else if (CascaderFoundation.#missingEntities.has(selectedItem)) {
            path = selectedItem.path;
        } else {
            const keyPath = selectedItem.path;
            path = Array.isArray(prop) ? keyPath.map((key: string) => keyEntities[key].data) : keyPath.map((key: string) => keyEntities[key].data[prop]);
        }
        return path;
    }

    override getStates(): BasicCascaderInnerData {
        const state = super.getStates();
        if (!this.getProp('multiple')) {
            return state;
        }
        return { ...state, ...CascaderFoundation.deriveMultipleState(this.getProps(), state) };
    }

    override getState<K extends keyof BasicCascaderInnerData>(key: K): BasicCascaderInnerData[K] {
        return DERIVED_STATE_KEYS.has(key) ? this.getStates()[key] : super.getState(key);
    }

    handleKeyDown = (e: E & Pick<KeyboardEvent, 'key' | 'preventDefault' | 'target'>) => {
        if (e.key === ESC_KEY) {
            const isOpen = this.getState('isOpen');
            // claim the key so the overlay stack does not also close an enclosing dialog
            if (isOpen) {
                e.preventDefault();
                // a field in a slot holds the focus: the popup hides with it, which would drop the focus to the body
                const focusInPopup = e.target instanceof Element && e.target.closest('[popover]') !== null;
                this.close();
                if (focusInPopup) {
                    this.focus();
                }
            }
        }
    };

    /**
     * Keys of the open popup (APG combobox with a tree popup, or a listbox while searching); focus stays on the
     * trigger or its search input. Up, Down, Home and End move within the current column or the search results;
     * Right opens a branch, then enters it; Left closes an open branch, else moves to the parent (swapped in RTL);
     * Enter and Space click the option, or check it in multiple mode; typed characters jump to the next shown option
     * starting with them (APG tree typeahead). In a search input Space and typed characters edit the text; while
     * searching only Up, Down and Enter navigate. Returns whether the key was used.
     */
    handleOptionKeyDown = (e: E & Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'preventDefault'>, { editing, rtl }: { editing: boolean; rtl: boolean }) => {
        const states = this.getStates();
        const { key } = e;
        if (!states.isOpen || e.ctrlKey || e.metaKey || e.altKey || (editing && key === ' ')) {
            return false;
        }
        if (editing && states.isSearching && !['ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
            return false;
        }
        if (!editing && !states.isSearching && this.#typeahead.accepts(e)) {
            e.preventDefault();
            const shown = this.#getShownOptions();
            const labels = shown.map(({ option }) => (typeof option.data.label === 'string' ? option.data.label : ''));
            const current = shown.findIndex(({ option }) => option.key === CascaderFoundation.getKeyboardKey(states));
            const target = shown[this.#typeahead.match(key, labels, current)];
            if (target) {
                this.#moveTo(target.option.key, target.index);
            }
            return true;
        }
        const currentKey = CascaderFoundation.getKeyboardKey(states);
        const parent = states.isSearching ? undefined : states.keyEntities[currentKey]?.parent;
        const options: Array<BasicEntity | BasicData> = parent ? parent.children : CascaderFoundation.getRenderData(this.getProps(), states);
        const index = options.findIndex((option) => option.key === currentKey);
        const current = options[index];
        if (key === 'Enter' || key === ' ') {
            if (!current) {
                return false;
            }
            e.preventDefault();
            if (!this.#isOptionDisabled(current)) {
                if (this.getProp('multiple')) {
                    this.onItemCheckboxClick(current);
                } else {
                    this.handleItemClick(e, current);
                }
            }
            return true;
        }
        const [into, out] = rtl ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
        if (key === into || key === out) {
            if (!current || states.isSearching) {
                return false;
            }
            e.preventDefault();
            this.#handleColumnKey(current as BasicEntity, key === into);
            return true;
        }
        const target = getListTargetIndex(key, index, options.length, () => false);
        if (target === null) {
            return false;
        }
        e.preventDefault();
        this.#moveTo(options[target].key, target);
        return true;
    };

    /** Re-collecting the options also re-resolves the value */
    override handlePropsChange(prev: Partial<BasicCascaderProps>) {
        const { treeData, keyMaps, value } = this.getProps();
        if (!isEqual(prev.treeData, treeData) || !isEqual(prev.keyMaps, keyMaps)) {
            this.handleTreeDataMutation();
        } else if (!this.getProp('multiple')) {
            this.#handleValueChange(value);
        }
    }

    /**
     * The host's treeData was changed in place (Vue, Svelte): the previous and current props share the node objects,
     * so `handlePropsChange` cannot see it.
     */
    handleTreeDataMutation = () => {
        if (this.getProp('multiple')) {
            // the multiple-mode keyEntities follow treeData during render; filteredKeys are state
            this.#recalculateFilteredKeys();
        } else {
            this.#collectOptions();
        }
    };

    open = () => {
        const filterable = this.#isFilterable();
        const { multiple } = this.getProps();
        const { isSearching } = this.getStates();
        this.setState({ isOpen: true });
        if (filterable) {
            // text typed while closed does not open the popup; opening starts from the columns, and onSearch hears
            // the keyword go
            this.setState({ inputValue: '', isSearching: false, filteredKeys: new Set() });
            if (isSearching) {
                this.adapter.notifyOnSearch('');
            }
            if (!multiple) {
                this.#toggle2SearchInput(true);
            }
        }
        if (this.isControlledComponent()) {
            this.#reCalcActiveKeys();
        }
        this.adapter.notifyDropdownVisibleChange(true);
    };

    /** Mousedown outside the trigger and dropdown while open */
    handleClickOutside = (e: MouseEvent) => {
        this.#notifyBlur(e);
        this.#close();
    };

    /** Focus entered the trigger (its search input, tags, clear button) or the dropdown from outside, by any means */
    handleFocusEnter = (e: E | FocusEvent) => {
        this.#notifyFocus(e);
    };

    /**
     * The focus left the trigger and the dropdown (the component checks where it went): reports the blur. An open
     * dropdown closes when the focus went to another element (APG combobox); a window blur has no target and keeps
     * it, as the native select does.
     */
    handleFocusLeave = (e: FocusEvent) => {
        this.#notifyBlur(e);
        if (e.relatedTarget && this.getState('isOpen')) {
            this.#close();
        }
    };

    /** Closes the dropdown; the focus stays in the component, so no blur */
    close = () => {
        this.#close();
    };

    focus = () => {
        this.adapter.focusCombobox();
    };

    blur = () => {
        this.adapter.blurCombobox();
    };

    /** Leaves search mode after the closed dropdown finishes its exit */
    endSearching = () => {
        this.setState({ isSearching: false });
    };

    /** A key that opens the dropdown sets the current option before the list mounts; it is scrolled to once shown */
    handlePopoverOpen = () => {
        const keyboardKey = this.getState('keyboardKey');
        if (!keyboardKey) {
            return;
        }
        const shown = this.#getShownOptions().find(({ option }) => option.key === keyboardKey);
        if (shown) {
            this.adapter.scrollToOption(keyboardKey, shown.index);
        }
    };

    handleItemClick = (e: E, item: BasicEntity | BasicData) => {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleSingleSelect(e, item);
    };

    handleItemHover = (_e: unknown, item: BasicEntity) => {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleShowNextByHover(item);
    };

    onItemCheckboxClick = (item: BasicEntity | BasicData) => {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleMultipleSelect(item);
    };

    handleClick = (e: E & Pick<UIEvent, 'detail' | 'target' | 'currentTarget'>) => {
        const isDisabled = this.#isDisabled();
        const isFilterable = this.#isFilterable();
        const { isOpen } = this.getStates();
        // Enter/Space on a control inside the trigger (tag, custom button) belongs to it: neither the keydown that
        // handleSelectionKeyDown forwards here (detail 0) nor its click toggles the popup
        if (isDisabled || isInnerControlActivation(e)) {
            return;
        }
        this.#notifyFocus(e);
        if (!isOpen) {
            this.open();
        } else if (!isFilterable) {
            this.close();
        }
    };

    /**
     * Enter toggles like a click; Down and Up open a closed popup (APG combobox). Without a search input (select-only
     * combobox) Space also opens it, and Home and End open it on the first and last option of the first column.
     * While open with no current option (handleOptionKeyDown left the key), Space outside a text field acts like
     * Enter, as in Select and TreeSelect. A search input keeps Space, Home and End for its text.
     */
    handleSelectionKeyDown = (keyboardEvent: E & Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'preventDefault' | 'detail' | 'target' | 'currentTarget'>) => {
        if (isBrowserChord(keyboardEvent)) {
            return;
        }
        const { key } = keyboardEvent;
        const isOpen = this.getState('isOpen');
        const opensOnArrow = (key === 'ArrowDown' || key === 'ArrowUp') && !isOpen;
        const opensSelectOnly = !isOpen && !this.#isFilterable() && (key === ' ' || key === 'Home' || key === 'End');
        const spaceWhileOpen = isOpen && key === ' ' && !isTextEditor(keyboardEvent.target);
        if (opensOnArrow || opensSelectOnly || spaceWhileOpen || isEnterPress(keyboardEvent)) {
            // Enter would submit the surrounding form; Space and End scroll the page
            keyboardEvent.preventDefault();
            this.handleClick(keyboardEvent);
        }
        if (opensSelectOnly && key !== ' ' && this.getState('isOpen')) {
            const column = CascaderFoundation.getRenderData(this.getProps(), this.getStates());
            const index = key === 'Home' ? 0 : column.length - 1;
            if (column[index]) {
                this.#moveTo(column[index].key, index);
            }
        }
    };

    handleInputChange = (sugInput: string) => {
        const filteredKeys = this.#calcFilteredKeys(sugInput);
        this.setState({
            inputValue: sugInput,
            isSearching: Boolean(sugInput),
            filteredKeys: new Set(filteredKeys),
            keyboardKey: null,
        });
        this.adapter.notifyOnSearch(sugInput);
    };

    handleClear = () => {
        const { isSearching, keyEntities, inputValue } = this.getStates();
        const { multiple } = this.getProps();
        const isFilterable = this.#isFilterable();
        const isControlled = this.isControlledComponent();
        const newState: Partial<BasicCascaderInnerData> = {};
        if (multiple) {
            // the button also shows for search text alone; only what changed is reported
            const hasValue = CascaderFoundation.hasMultipleValue(this.getProps(), this.getStates());
            newState.isSearching = false;
            this.#clearInput();
            if (inputValue) {
                this.adapter.notifyOnSearch('');
            }
            newState.checkedKeys = new Set([]);
            newState.halfCheckedKeys = new Set([]);
            newState.selectedKeys = new Set([]);
            newState.activeKeys = new Set([]);
            newState.resolvedCheckedKeys = new Set([]);
            newState.checkedEntities = keyEntities;
            if (hasValue) {
                this.adapter.notifyChange([]);
            }
        } else {
            if (isFilterable && isSearching) {
                newState.isSearching = false;
                this.#clearInput();
                this.adapter.notifyOnSearch('');
            } else {
                if (isFilterable) {
                    newState.inputValue = '';
                    this.#clearInput();
                    this.adapter.notifyOnSearch('');
                }
                if (!isControlled) {
                    newState.selectedKeys = new Set([]);
                }
                newState.activeKeys = new Set([]);
                newState.filteredKeys = new Set([]);
                this.adapter.notifyChange([]);
            }
        }

        this.setState(newState as BasicCascaderInnerData);
        this.adapter.notifyClear();
    };

    handleListScroll = (e: LE, ind: number) => {
        const { activeKeys, keyEntities } = this.getStates();
        const lastActiveKey = [...activeKeys].at(-1);
        const data = lastActiveKey ? (keyEntities?.[lastActiveKey]?.data ?? null) : null;
        this.adapter.notifyListScroll(e, { panelIndex: ind, activeNode: data });
    };

    handleTagRemoveByKey = (key: string) => {
        const states = this.getStates();
        if (CascaderFoundation.isTagClosable(key, this.getProps(), states)) {
            this.#handleMultipleSelect(states.keyEntities[key]);
        }
    };

    handleTagRemoveInTrigger = (pos: string) => {
        const { treeData, keyMaps } = this.getProps();
        const key = getKeyByPos(pos, treeData, keyMaps);
        this.handleTagRemoveByKey(key);
    };
}
