import { isEqual, difference } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { findAncestorKeys, calcCheckedKeysForUnchecked, calcCheckedKeysForChecked, calcCheckedKeys, calcDisabledKeys, findDescendantKeys, normalizeKeyList, normalizedArr } from '../tree/tree-util';
import { strings } from './constants';
import { type KeyMapProps, filter, getColumns, convertDataToEntities, calcMergeType, getKeyByValuePath, getKeysByValuePath, getKeyByPos, getValueOrKey } from './util';

export type { KeyMapProps };
import { getListTargetIndex, isInnerControlActivation, isTextEditor, Typeahead } from '../utils/a11y';
import isEnterPress from '../utils/is-enter-press';
import isObject from '../utils/is-object';
import { ESC_KEY } from '../utils/key-code';
import type { Size } from '../utils/type';

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
    _notExist?: boolean;
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
    dropdownClassName?: string;
    dropdownStyle?: any;
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

/** The multiple-mode checked sets */
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
    disabledKeys?: Set<string>;
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
    updateStates: (states: Partial<BasicCascaderInnerData>) => void;
    notifyChange: (value: BasicValue) => void;
    notifySelect: (selected: string | number | Array<string | number>) => void;
    notifyOnSearch: (input: string) => void;
    notifyFocus: (e: E) => void;
    notifyBlur: (e?: E | MouseEvent) => void;
    notifyDropdownVisibleChange: (visible: boolean) => void;
    /**
     * Calls `loadData`. `callback` must run after the treeData update it caused is applied, since that update keeps
     * the selection and activeKeys only while the key is still in loadingKeys. `onReject` runs on rejection, which
     * must still reach the caller.
     */
    notifyLoadData: (selectedOpt: BasicCascaderData[], callback: (data?: BasicEntities) => void, onReject: () => void) => void;
    notifyOnLoad: (newLoadedKeys: Set<string>, data: BasicCascaderData) => void;
    notifyListScroll: (e: LE, panel: BasicScrollPanelProps) => void;
    notifyOnExceed: (data: BasicEntity[]) => void;
    toggleInputShow: (show: boolean, cb: () => void) => void;
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
const DERIVE_PROP_KEYS = ['treeData', 'keyMaps', 'checkRelation', 'disableStrictly', 'autoMergeValue', 'leafOnly', 'onChangeWithObject', 'value'] as const satisfies readonly (keyof BasicCascaderProps)[];

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
    // StrictMode and React Activity replay init on this instance after destroy, over a dropdown the user may have
    // closed since: defaultOpen belongs to the first mount
    #initialized = false;
    readonly #typeahead = new Typeahead();

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

        if (typeof filterSorter === 'function') {
            filteredList.sort((a, b) => filterSorter(a.pathData, b.pathData, inputValue));
        }
        return filteredList;
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

    /** The states that select `value` from `state`, and the entities with a placeholder for a value treeData lacks */
    static #selectionFor(props: BasicCascaderProps, state: BasicCascaderInnerData, value: BasicValue, keyEntities: BasicEntities) {
        const { changeOnSelect, onChangeWithObject, keyMaps, loadData, multiple } = props;
        const { activeKeys, loadingKeys, keyEntities: keyEntityState, selectedKeys: selectedKeysState } = state;
        const filterable = Boolean(props.filterTreeNode);
        const loadingActive = [...activeKeys].filter((i) => loadingKeys.has(i));
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
            if (changeOnSelect || CascaderFoundation.#isLeafData(selectedItem.data, loadData)) {
                updateStates.selectedKeys = new Set([selectedKey]);
                if (!loadingActive.length) {
                    updateStates.activeKeys = new Set(selectedItem.path);
                }
                /**
                 * A path ending at a branch selects nothing without changeOnSelect (a selected leaf that treeData turns
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
                _notExist: true,
            };
            updateStates.selectedKeys = new Set([key]);
            // a copy: keyEntities may be the state's own object
            keyEntities = { ...keyEntities, [key]: optionNotExist as BasicEntity };
        } else if (loadingKeys.size) {
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

    #isDisabled() {
        return this.getProp('disabled');
    }

    #isFilterable() {
        return Boolean(this.getProp('filterTreeNode'));
    }

    #notifySingleChange(item: BasicEntity | BasicData) {
        const valueProp = this.getProp('onChangeWithObject') ? [] : 'value';
        this._adapter.notifyChange(this.getItemPropPath(item.key, valueProp));
    }

    #notifyMultipleChange(checkedKeys: Set<string>) {
        const valueProp = this.getProp('onChangeWithObject') ? [] : 'value';
        const keyEntities = this.getState('keyEntities');
        const paths = [...checkedKeys].map((checkedKey) => this.getItemPropPath(checkedKey, valueProp, keyEntities));
        this._adapter.notifyChange([...CascaderFoundation.#missingValuePaths(this.getProps(), keyEntities), ...paths]);
    }

    #isLeaf(item: BasicCascaderData) {
        return CascaderFoundation.#isLeafData(item, this.getProp('loadData'));
    }

    #clearInput() {
        this._adapter.updateStates({ inputValue: '' });
    }

    #notifyBlur(e?: E | MouseEvent) {
        this._adapter.notifyBlur(e);
    }

    #close(key?: string) {
        const { multiple } = this.getProps();
        this._adapter.updateStates({ isOpen: false, keyboardKey: null });
        this._adapter.notifyDropdownVisibleChange(false);
        if (this.#isFilterable()) {
            const { selectedKeys } = this.getStates();
            let inputValue = '';
            if (key && !multiple) {
                inputValue = this.renderDisplayText(key);
            } else if (selectedKeys.size && !multiple) {
                inputValue = this.renderDisplayText([...selectedKeys][0]);
            }
            // reset isSearching here, not in afterClose: open() clears inputValue while isSearching could still be true
            this._adapter.updateStates({ inputValue, isSearching: false });
            if (!multiple) {
                this.#toggle2SearchInput(false);
            }
        }
    }

    #notifyFocus(e: E) {
        this._adapter.notifyFocus(e);
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
        return entity._notExist ? entity.path : entity.valuePath;
    }

    /**
     * Filtered keys for the current props: remote mode treats the current treeData nodes as results without
     * matching; local mode matches by filterTreeNode.
     */
    #calcFilteredKeys(sugInput: string, keyEntities?: BasicEntities) {
        if (!sugInput) {
            return [];
        }
        const { treeNodeFilterProp, filterTreeNode, filterLeafOnly, remote, keyMaps } = this.getProps();
        const realFilterProp = treeNodeFilterProp !== 'label' ? treeNodeFilterProp : (keyMaps?.label ?? 'label');
        keyEntities ??= this.getState('keyEntities');
        const entities = Object.values(keyEntities);

        if (remote) {
            return entities
                .filter((item) => !item._notExist)
                .filter((item) => (filterTreeNode && !filterLeafOnly) || this.#isLeaf(item.data))
                .map((item) => item.key);
        }

        return entities
            .filter(({ key, _notExist, data }) => {
                if (_notExist) {
                    return false;
                }
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
        const { checkedKeys, keyEntities, resolvedCheckedKeys } = this.getStates();
        const { autoMergeValue, max, disableStrictly, leafOnly } = this.getProps();
        const missingCount = CascaderFoundation.#missingValuePaths(this.getProps(), keyEntities).length;
        const prevCheckedStatus = checkedKeys.has(key);
        const curCheckedStatus = disableStrictly ? this.calcCheckedStatus(!prevCheckedStatus, key) : !prevCheckedStatus;
        const { checkedKeys: curCheckedKeys, halfCheckedKeys: curHalfCheckedKeys } = disableStrictly ? this.calcNonDisabledCheckedKeys(key, curCheckedStatus) : this.calcCheckedKeys(key, curCheckedStatus);

        const mergeType = calcMergeType(autoMergeValue, leafOnly);
        const isLeafOnlyMerge = mergeType === strings.LEAF_ONLY_MERGE_TYPE;
        const isNoneMerge = mergeType === strings.NONE_MERGE_TYPE;

        const curResolvedCheckedKeys = new Set(normalizeKeyList(curCheckedKeys, keyEntities, isLeafOnlyMerge));

        const curRealCheckedKeys = isNoneMerge ? curCheckedKeys : curResolvedCheckedKeys;

        if (typeof max === 'number') {
            if (!isNoneMerge) {
                // past max, the selection may shrink but not grow
                if (resolvedCheckedKeys.size < curResolvedCheckedKeys.size && curResolvedCheckedKeys.size + missingCount > max) {
                    const checkedEntities: BasicEntity[] = [];
                    curResolvedCheckedKeys.forEach((itemKey) => {
                        checkedEntities.push(keyEntities[itemKey]);
                    });
                    this._adapter.notifyOnExceed(checkedEntities);
                    return;
                }
            } else {
                if (checkedKeys.size < curCheckedKeys.size && curCheckedKeys.size + missingCount > max) {
                    const checkedEntities: BasicEntity[] = [];
                    curCheckedKeys.forEach((itemKey: string) => {
                        checkedEntities.push(keyEntities[itemKey]);
                    });
                    this._adapter.notifyOnExceed(checkedEntities);
                    return;
                }
            }
        }
        if (!this._isControlledComponent()) {
            this._adapter.updateStates({
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
                    this._adapter.notifyOnExceed(checkedEntities);
                    return;
                }
            }
            newCheckedKeys.add(key);
            targetStatus = true;
        }
        if (!this._isControlledComponent()) {
            this._adapter.updateStates({
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
        this._adapter.notifySelect(formatValue);
    }

    #toggle2SearchInput(isShow: boolean) {
        if (isShow) {
            this._adapter.toggleInputShow(isShow, () => this.focus());
        } else {
            this._adapter.toggleInputShow(isShow, () => undefined);
        }
    }

    #handleShowNextByHover(item: BasicEntity) {
        const { keyEntities } = this.getStates();
        const { data, key } = item;
        const isLeaf = this.#isLeaf(data);
        const activeKeys = keyEntities[key].path;
        this._adapter.updateStates({
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
        this._adapter.notifyOnLoad(newLoadedKeys, data);
        this._adapter.updateStates({
            loadingKeys: newLoadingKeys,
            loadedKeys: newLoadedKeys,
        });
    }

    #notifyIfLoadData(item: BasicEntity | BasicData) {
        const { data, key } = item;
        if (!data.isLeaf && !data.children && this.getProp('loadData')) {
            const { loadedKeys, loadingKeys, keyEntities } = this.getStates();
            if (loadedKeys.has(key) || loadingKeys.has(key)) {
                return;
            }
            const optionPath = this.getItemPropPath(key, [], keyEntities);
            this._adapter.updateStates({ loadingKeys: new Set(loadingKeys).add(key) });
            this._adapter.notifyLoadData(optionPath, this.#handleNodeLoad.bind(this, item), this.#handleNodeLoadReject.bind(this, item));
        }
    }

    // clears the loading state so the option can be retried
    #handleNodeLoadReject(item: BasicEntity | BasicData) {
        const newLoadingKeys = new Set(this.getState('loadingKeys'));
        newLoadingKeys.delete(item.key);
        this._adapter.updateStates({ loadingKeys: newLoadingKeys });
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
            this._adapter.updateStates({ activeKeys: new Set(activeKeys) });
            this.#notifyIfLoadData(item);
            return;
        }
        if (multiple) {
            this._adapter.updateStates({ activeKeys: new Set(activeKeys) });
            if (clickToSelect || (isLeaf && enableLeafClick)) {
                this.onItemCheckboxClick(item);
            }
        } else {
            this._adapter.notifySelect(data.value);
            if (hasChanged) {
                this.#notifySingleChange(item);
                this.#notifyIfLoadData(item);
                if (this._isControlledComponent()) {
                    this._adapter.updateStates({ activeKeys: new Set(activeKeys) });
                    if (isLeaf || (!filterLeafOnly && isSearching)) {
                        this.close(e);
                    }
                    return;
                }

                this._adapter.updateStates({
                    activeKeys: new Set(activeKeys),
                    selectedKeys: new Set(selectedKey),
                });

                if (isLeaf) {
                    this.close(e, key);
                } else if (!filterLeafOnly && isSearching) {
                    this.close(e, key);
                }
            } else {
                this.close(e);
            }
        }
    }

    #updateSelectedKey(value: BasicValue, keyEntities: BasicEntities) {
        const selection = CascaderFoundation.#selectionFor(this.getProps(), this.getStates(), value, keyEntities);
        this._adapter.updateStates(selection.updateStates);
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
            this._adapter.updateStates({
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
            this._adapter.updateStates({ activeKeys: new Set(option.path.slice(0, -1)) });
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
        this._adapter.updateStates({ keyboardKey: key });
        this._adapter.scrollToOption(key, index);
    }

    /** The options of the shown columns in display order, with their index in their column */
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

        const selectedValue = !this._isControlledComponent() ? cacheValue : value === undefined ? [] : value;
        if (selectedValue != null) {
            keyEntities = this.#updateSelectedKey(selectedValue, keyEntities);
        } else {
            this._adapter.updateStates({ keyEntities });
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
        if (nextKeyEntities) {
            updateStates.keyEntities = nextKeyEntities;
        }
        this._adapter.updateStates(updateStates);
    }

    #handleValueChange(value: BasicValue) {
        const { keyEntities } = this.getStates();
        this.#updateSelectedKey(value, keyEntities);
        // a controlled pick closes before the parent writes the value back, so the closed input text follows it here
        const { isOpen, selectedKeys } = this.getStates();
        if (this.#isFilterable() && !this.getProp('multiple') && !isOpen && selectedKeys.size) {
            this._adapter.updateStates({ inputValue: this.renderDisplayText([...selectedKeys][0]) });
        }
    }

    protected getItemPropPath(selectedKey: string, prop: string | any[], keyEntities?: BasicEntities) {
        return CascaderFoundation.getItemPropPath(selectedKey, prop, keyEntities || this.getState('keyEntities'));
    }

    protected renderDisplayText(targetKey: string, keyEntities?: BasicEntities) {
        const renderFunc = this.getProp('displayRender');
        const displayProp = this.getProp('displayProp');
        const displayPath = this.getItemPropPath(targetKey, displayProp, keyEntities);
        return this.#defaultRenderText(displayPath, renderFunc);
    }

    protected calcNonDisabledCheckedKeys(eventKey: string, targetStatus: boolean) {
        const { keyEntities, disabledKeys } = this.getStates();
        const checkedKeys = new Set(this.getState('checkedKeys'));
        const descendantKeys = normalizeKeyList(findDescendantKeys([eventKey], keyEntities, false), keyEntities, true);
        const hasDisabled = descendantKeys.some((key) => disabledKeys.has(key));
        if (!hasDisabled) {
            return this.calcCheckedKeys(eventKey, targetStatus);
        }

        const nonDisabled = descendantKeys.filter((key) => !disabledKeys.has(key));
        const newCheckedKeys = targetStatus ? [...nonDisabled, ...checkedKeys] : difference(normalizeKeyList([...checkedKeys], keyEntities, true), nonDisabled);
        return calcCheckedKeys(newCheckedKeys, keyEntities);
    }

    protected calcCheckedStatus(targetStatus: boolean, eventKey: string) {
        if (!targetStatus) {
            return targetStatus;
        }
        const { checkedKeys, keyEntities, disabledKeys } = this.getStates();
        const descendantKeys = normalizeKeyList(findDescendantKeys([eventKey], keyEntities, false), keyEntities, true);
        const hasDisabled = descendantKeys.some((key) => disabledKeys.has(key));
        if (!hasDisabled) {
            return targetStatus;
        }
        const nonDisabledKeys = descendantKeys.filter((key) => !disabledKeys.has(key));
        const allChecked = nonDisabledKeys.every((key) => checkedKeys.has(key));
        return !allChecked;
    }

    protected calcCheckedKeys(key: string, curCheckedStatus: boolean) {
        const { keyEntities } = this.getStates();
        const checkedKeys = new Set(this.getState('checkedKeys'));
        const halfCheckedKeys = new Set(this.getState('halfCheckedKeys'));
        return curCheckedStatus ? calcCheckedKeysForChecked(key, keyEntities, checkedKeys, halfCheckedKeys) : calcCheckedKeysForUnchecked(key, keyEntities, checkedKeys, halfCheckedKeys);
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

    /** Checked, half checked and merged keys for a list of checked keys */
    static calcCheckedState(keys: string[], keyEntities: BasicEntities, { checkRelation, autoMergeValue, leafOnly }: BasicCascaderProps): BasicCheckedState {
        if (checkRelation !== strings.RELATED) {
            return { checkedKeys: new Set(keys), halfCheckedKeys: new Set(), resolvedCheckedKeys: new Set() };
        }
        const calRes = calcCheckedKeys(keys, keyEntities);
        const checkedKeys: Set<string> = new Set(calRes.checkedKeys);
        const isLeafOnlyMerge = calcMergeType(autoMergeValue, leafOnly) === strings.LEAF_ONLY_MERGE_TYPE;
        return {
            checkedKeys,
            halfCheckedKeys: new Set(calRes.halfCheckedKeys),
            resolvedCheckedKeys: new Set(normalizeKeyList(checkedKeys, keyEntities, isLeafOnlyMerge)),
        };
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

    /** The flattened search results while searching, otherwise the top level */
    static getRenderData(props: BasicCascaderProps, state: BasicCascaderInnerData): Array<BasicEntity | BasicData> {
        const { keyEntities, isSearching } = state;
        if (isSearching && Boolean(props.filterTreeNode)) {
            return CascaderFoundation.#getFilteredData(props, state);
        }
        return Object.values(keyEntities)
            .filter((item) => item.parentKey === null && !item._notExist)
            .sort((a, b) => a.ind - b.ind);
    }

    /** Whether an option opens a column: it has children, or loadData may load some */
    static isBranch(data: BasicCascaderData, loadData: unknown) {
        return Boolean(data.children?.length) || Boolean(loadData && !data.isLeaf);
    }

    /**
     * What a treeitem in a column shows and exposes. An option that is both active and selected shows only as selected,
     * and in multiple mode selection is the checkbox's, so the row is never marked selected.
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

    static getItemPropPath(selectedKey: string, prop: string | any[], keyEntities: BasicEntities) {
        const selectedItem = keyEntities[selectedKey];
        let path = [];
        if (!selectedItem) {
            // do nothing
        } else if (selectedItem._notExist) {
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
        // Read only what deriveMultipleState, getRealKeys and calcCheckedState use: a Vue getProps() copies every prop
        const props = {} as BasicCascaderProps;
        for (const key of DERIVE_PROP_KEYS) {
            (props as Record<string, unknown>)[key] = this.getProp(key);
        }
        return { ...state, ...CascaderFoundation.deriveMultipleState(props, state) };
    }

    override getState<K extends keyof BasicCascaderInnerData>(key: K): BasicCascaderInnerData[K] {
        return DERIVED_STATE_KEYS.has(key) ? this.getStates()[key] : super.getState(key);
    }

    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        if (this.getProp('defaultOpen') && !this.#isDisabled()) {
            this.open();
        }
    }

    handleKeyDown(e: E & Pick<KeyboardEvent, 'key' | 'preventDefault'>) {
        if (e.key === ESC_KEY) {
            const isOpen = this.getState('isOpen');
            // claim the key so the overlay stack does not also close an enclosing dialog
            if (isOpen) {
                e.preventDefault();
                this.close(e);
            }
        }
    }

    /**
     * Keys of the open popup (APG combobox with a tree popup, or a listbox while searching); focus stays on the
     * trigger or its search input. Up, Down, Home and End move within the current column or the search results;
     * Right opens a branch, then enters it; Left closes an open branch, else moves to the parent (swapped in RTL);
     * Enter and Space click the option, or check it in multiple mode; typed characters jump to the next shown option
     * starting with them (APG tree typeahead). In a search input Space and typed characters edit the text; while
     * searching only Up, Down and Enter navigate. Returns whether the key was used.
     */
    handleOptionKeyDown(e: E & Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'preventDefault'>, { editing, rtl }: { editing: boolean; rtl: boolean }) {
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
    }

    /**
     * After an update, the host reports whether the options (treeData or keyMaps) and value changed by its own change
     * detection. Re-collecting the options also re-resolves the value.
     */
    handleInputsChange({ optionsChanged, valueChanged }: { optionsChanged: boolean; valueChanged: boolean }, value: BasicValue) {
        if (this.getProp('multiple')) {
            // the multiple-mode keyEntities follow treeData during render; filteredKeys are state
            if (optionsChanged) {
                this.#recalculateFilteredKeys();
            }
            return;
        }
        if (optionsChanged) {
            this.#collectOptions();
        } else if (valueChanged) {
            this.#handleValueChange(value);
        }
    }

    open() {
        const filterable = this.#isFilterable();
        const { multiple } = this.getProps();
        const { isSearching } = this.getStates();
        this._adapter.updateStates({ isOpen: true });
        if (filterable) {
            // text typed while closed does not open the popup; opening starts from the columns, and onSearch hears
            // the keyword go
            this._adapter.updateStates({ inputValue: '', isSearching: false, filteredKeys: new Set() });
            if (isSearching) {
                this._adapter.notifyOnSearch('');
            }
            if (!multiple) {
                this.#toggle2SearchInput(true);
            }
        }
        if (this._isControlledComponent()) {
            this.#reCalcActiveKeys();
        }
        this._adapter.notifyDropdownVisibleChange(true);
    }

    /** Mousedown outside the trigger and dropdown while open */
    handleClickOutside(e: MouseEvent) {
        this.close(e);
    }

    close(e?: E | MouseEvent, key?: string) {
        this.#close(key);
        this.#notifyBlur(e);
    }

    /** Closes without a blur; called when Vue KeepAlive deactivates the host */
    deactivate() {
        this.#close();
    }

    focus() {
        this._adapter.focusCombobox();
    }

    blur() {
        this._adapter.blurCombobox();
    }

    /** Leaves search mode after the closed dropdown finishes its exit */
    endSearching() {
        this._adapter.updateStates({ isSearching: false });
    }

    /** A key that opens the dropdown sets the current option before the list mounts; it is scrolled to once shown */
    handlePopoverOpen() {
        const keyboardKey = this.getState('keyboardKey');
        if (!keyboardKey) {
            return;
        }
        const shown = this.#getShownOptions().find(({ option }) => option.key === keyboardKey);
        if (shown) {
            this._adapter.scrollToOption(keyboardKey, shown.index);
        }
    }

    handleItemClick(e: E, item: BasicEntity | BasicData) {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleSingleSelect(e, item);
    }

    handleItemHover(_e: unknown, item: BasicEntity) {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleShowNextByHover(item);
    }

    onItemCheckboxClick(item: BasicEntity | BasicData) {
        const isDisabled = this.#isDisabled();
        if (isDisabled) {
            return;
        }
        this.#handleMultipleSelect(item);
    }

    handleClick(e: E & Pick<UIEvent, 'detail' | 'target' | 'currentTarget'>) {
        const isDisabled = this.#isDisabled();
        const isFilterable = this.#isFilterable();
        const { isOpen } = this.getStates();
        // Enter/Space on a control inside the trigger (tag, custom button) belongs to it: neither the keydown that
        // handleSelectionKeyDown forwards here (detail 0) nor its click toggles the popup
        if (isDisabled || isInnerControlActivation(e)) {
            return;
        } else if (!isOpen) {
            this.open();
            this.#notifyFocus(e);
        } else if (isOpen && !isFilterable) {
            this.close(e);
        }
    }

    /**
     * Enter toggles like a click; Down and Up open a closed popup (APG combobox). Without a search input (select-only
     * combobox) Space also opens it, and Home and End open it on the first and last option of the first column.
     * While open with no current option (handleOptionKeyDown left the key), Space outside a text field acts like
     * Enter, as in Select and TreeSelect. A search input keeps Space, Home and End for its text.
     */
    handleSelectionKeyDown(keyboardEvent: E & Pick<KeyboardEvent, 'key' | 'preventDefault' | 'detail' | 'target' | 'currentTarget'>) {
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
    }

    handleInputChange(sugInput: string) {
        const filteredKeys = this.#calcFilteredKeys(sugInput);
        this._adapter.updateStates({
            inputValue: sugInput,
            isSearching: Boolean(sugInput),
            filteredKeys: new Set(filteredKeys),
            keyboardKey: null,
        });
        this._adapter.notifyOnSearch(sugInput);
    }

    handleClear() {
        const { isSearching, keyEntities, inputValue } = this.getStates();
        const { multiple } = this.getProps();
        const isFilterable = this.#isFilterable();
        const isControlled = this._isControlledComponent();
        const newState: Partial<BasicCascaderInnerData> = {};
        if (multiple) {
            // the button also shows for search text alone; only what changed is reported
            const hasValue = CascaderFoundation.hasMultipleValue(this.getProps(), this.getStates());
            newState.isSearching = false;
            this.#clearInput();
            if (inputValue) {
                this._adapter.notifyOnSearch('');
            }
            newState.checkedKeys = new Set([]);
            newState.halfCheckedKeys = new Set([]);
            newState.selectedKeys = new Set([]);
            newState.activeKeys = new Set([]);
            newState.resolvedCheckedKeys = new Set([]);
            newState.checkedEntities = keyEntities;
            if (hasValue) {
                this._adapter.notifyChange([]);
            }
        } else {
            if (isFilterable && isSearching) {
                newState.isSearching = false;
                this.#clearInput();
                this._adapter.notifyOnSearch('');
            } else {
                if (isFilterable) {
                    newState.inputValue = '';
                    this.#clearInput();
                    this._adapter.notifyOnSearch('');
                }
                if (!isControlled) {
                    newState.selectedKeys = new Set([]);
                }
                newState.activeKeys = new Set([]);
                newState.filteredKeys = new Set([]);
                this._adapter.notifyChange([]);
            }
        }

        this._adapter.updateStates(newState);
        this._adapter.notifyClear();
    }

    handleListScroll(e: LE, ind: number) {
        const { activeKeys, keyEntities } = this.getStates();
        const lastActiveKey = [...activeKeys].at(-1);
        const data = lastActiveKey ? (keyEntities?.[lastActiveKey]?.data ?? null) : null;
        this._adapter.notifyListScroll(e, { panelIndex: ind, activeNode: data });
    }

    handleTagRemoveByKey(key: string) {
        const { keyEntities } = this.getStates();
        const { disabled } = this.getProps();
        if (disabled) {
            return;
        }
        const removedItem = keyEntities[key];
        if (removedItem && !removedItem.data?.disabled) {
            this.#handleMultipleSelect(removedItem);
        }
    }

    handleTagRemoveInTrigger(pos: string) {
        const { treeData, keyMaps } = this.getProps();
        const key = getKeyByPos(pos, treeData, keyMaps);
        this.handleTagRemoveByKey(key);
    }
}
