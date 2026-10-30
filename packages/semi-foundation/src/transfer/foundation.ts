import { omit } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { BasicValue as BasicTreeValue } from '../tree/foundation';
import arrayMove from '../utils/array-move';
import { numbers, strings } from './constants';
import { _generateDataByType, _generateSelectedItems } from './transfer-utils';

export interface BasicDataItem {
    [x: string]: any;
    key: string | number;
    label?: any;
    value?: string | number;
    disabled?: boolean;
    fullPath?: Array<BasicDataItem>;
}

export type DataItemMap = Map<number | string, BasicDataItem>;

export interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
}

export interface BasicGroupItem {
    title?: string;
    children?: BasicDataItem[];
}

export interface BasicResolvedDataItem extends BasicDataItem {
    /** The item's group in groupList mode, shared by every item of that group */
    _parent?: Omit<BasicGroupItem, 'children'>;
    /** The nodes from the root to this one in treeList mode; underscored so it never collides with the caller's `path` */
    _path?: Array<BasicDataItem>;
    /** Whether the node has no children in treeList mode; underscored for the same reason as `_path` */
    _isLeaf?: boolean;
}

export type BasicFilter = boolean | ((searchValue: string, item: BasicDataItem) => boolean);

/** The props the foundation reads with getProp */
export interface TransferBaseProps {
    dataSource?: Array<object>;
    defaultValue?: Array<number | string>;
    disabled?: boolean;
    filter?: BasicFilter;
    pagination?: { currentPage?: number };
    showPath?: boolean;
    type?: string;
    value?: Array<number | string>;
}

/** The state the foundation reads with getState */
export interface TransferBaseState {
    inputValue: string;
    leftCurrentPage: number;
    /** The uncontrolled selection, in the shape of `value`; it is resolved against the dataSource when read */
    selectedValues: Array<number | string>;
}

/** E is the host's focusout event, passed on to notifyBlur */
export interface TransferAdapter<P extends TransferBaseProps = TransferBaseProps, S extends TransferBaseState = TransferBaseState, E = FocusEvent> extends DefaultAdapter<P, S> {
    notifyBlur: (e: E) => void;
    updateSelected: (values: Array<number | string>) => void;
    notifyChange: (values: Array<number | string>, items: Array<BasicDataItem>) => void;
    notifySearch: (searchValue: string) => void;
    notifySelect: (item: BasicDataItem) => void;
    notifyDeselect: (item: BasicDataItem) => void;
    updateInput: (input: string) => void;
    searchTree: (keyword: string) => void;
    updateCurrentPage: (currentPage: number) => void;
    notifyPageChange: (currentPage: number) => void;
}

export default class TransferFoundation<P extends TransferBaseProps = TransferBaseProps, S extends TransferBaseState = TransferBaseState, E = FocusEvent> extends BaseFoundation<TransferAdapter<P, S, E>, P, S> {
    #getData() {
        const { dataSource, type } = this.getProps();
        return TransferFoundation.getData(dataSource, type);
    }

    #getSelected(data: Array<BasicResolvedDataItem>) {
        return TransferFoundation.getSelectedItems(this.getProp('value'), data, this.getState('selectedValues'));
    }

    #injectFullPath(item: BasicResolvedDataItem) {
        const { type, showPath } = this.getProps();
        return TransferFoundation.toPublicItem(item, type, showPath);
    }

    #getValuesAndItems(selectedItems: DataItemMap) {
        const { type, showPath } = this.getProps();
        return TransferFoundation.getValuesAndItemsFromMap(selectedItems, type, showPath);
    }

    #updateSelected(selectedItems: DataItemMap) {
        const { values, items } = this.#getValuesAndItems(selectedItems);
        // mirrors getSelectedItems: null falls back to the state like undefined
        if (!Array.isArray(this.getProp('value'))) {
            this.adapter.updateSelected(values);
        }
        this.adapter.notifyChange(values, items);
    }

    /** The flat item list of a dataSource: groupList items carry `_parent`, treeList nodes carry `_path` */
    static getData(dataSource: unknown, type: string): Array<BasicResolvedDataItem> {
        return Array.isArray(dataSource) ? _generateDataByType(dataSource, type) : [];
    }

    /**
     * Each groupList group's position among the groups of `getData`'s result. Search and paging leave it unchanged,
     * so it keys and names the group rows; titles cannot, as they may repeat, be absent or hold spaces.
     */
    static getGroupIndexes(data: Array<BasicResolvedDataItem>): Map<BasicResolvedDataItem['_parent'], number> {
        const indexes = new Map<BasicResolvedDataItem['_parent'], number>();
        for (const { _parent } of data) {
            if (!indexes.has(_parent)) {
                indexes.set(_parent, indexes.size);
            }
        }
        return indexes;
    }

    /**
     * The selection in order, keyed by item key: a controlled `value`, else the uncontrolled values, resolved against
     * the current data so the items follow the dataSource
     */
    static getSelectedItems(value: unknown, data: Array<BasicResolvedDataItem>, selectedValues: Array<number | string>): DataItemMap {
        return _generateSelectedItems(Array.isArray(value) ? value : selectedValues, data);
    }

    /** Keys matching a non-empty search; treeList leaves the filtering to its Tree, so every node matches */
    static getSearchResult(data: Array<BasicResolvedDataItem>, inputValue: string, filter: BasicFilter, type: string) {
        if (type === strings.TYPE_TREE_TO_LIST) {
            return new Set(data.map((item) => item.key));
        }
        const input = inputValue.toLowerCase();
        const match = typeof filter === 'function' ? (item: BasicResolvedDataItem) => filter(inputValue, item) : (item: BasicResolvedDataItem) => (typeof item.label === 'string' || typeof item.label === 'number') && String(item.label).toLowerCase().includes(input);
        return new Set(data.filter(match).map((item) => item.key));
    }

    /** The items shown on the left: those matching the search, or all of them when `searchResult` is null */
    static getFilterData<T extends BasicResolvedDataItem>(data: Array<T>, searchResult: Set<number | string> | null) {
        return searchResult ? data.filter((item) => searchResult.has(item.key)) : data;
    }

    /** The items "select all" acts on; treeList selects leaves only, as its Tree does */
    static getEnabledItems<T extends BasicResolvedDataItem>(filterData: Array<T>, type: string) {
        const isTree = type === strings.TYPE_TREE_TO_LIST;
        return filterData.filter((item) => !item.disabled && (!isTree || item._isLeaf));
    }

    /** The treeList leaf count shown in the header; undefined for the other types */
    static getLeafCount(filterData: Array<BasicResolvedDataItem>, type: string): number | undefined {
        return type === strings.TYPE_TREE_TO_LIST ? filterData.filter((item) => item._isLeaf).length : undefined;
    }

    static getPageSize(pagination?: { pageSize?: number }) {
        return pagination?.pageSize ?? numbers.DEFAULT_PAGE_SIZE;
    }

    static getTotalPage(pagination: { pageSize?: number } | undefined, total: number) {
        return Math.ceil(total / TransferFoundation.getPageSize(pagination));
    }

    /** The page the left list is on before clamping: the controlled `currentPage`, else the internal one */
    static getPageNumber(pagination: { currentPage?: number } | undefined, statePage: number) {
        return typeof pagination?.currentPage === 'number' ? pagination.currentPage : statePage;
    }

    /** The left page clamped into the page count, so a search or a shrinking dataSource never leaves it past the end */
    static getCurrentPage(pagination: { currentPage?: number; pageSize?: number } | undefined, statePage: number, total: number) {
        const totalPage = TransferFoundation.getTotalPage(pagination, total);
        return Math.min(TransferFoundation.getPageNumber(pagination, statePage), Math.max(totalPage, 1));
    }

    static getFullPath(item: BasicResolvedDataItem, type: string, showPath: boolean): Array<BasicDataItem> | undefined {
        if (type !== strings.TYPE_TREE_TO_LIST || showPath !== true || !Array.isArray(item._path)) {
            return undefined;
        }
        return item._path.map((pathItem: BasicDataItem) => ({ ...pathItem }));
    }

    static getValuesAndItemsFromMap(selectedItems: DataItemMap, type: string, showPath: boolean) {
        const items: Array<BasicResolvedDataItem> = [];
        const values: Array<number | string> = [];
        for (const selected of selectedItems.values()) {
            const result = TransferFoundation.toPublicItem(selected as BasicResolvedDataItem, type, showPath);
            items.push(result);
            values.push(result.value);
        }
        return { items, values };
    }

    /** The item as handed to callbacks: internal fields (`_parent`, `_path`, `_isLeaf`) removed, `fullPath` added */
    static toPublicItem(item: BasicResolvedDataItem, type: string, showPath: boolean) {
        let publicItem = item;
        if (type === strings.TYPE_GROUP_LIST) {
            publicItem = omit(item, ['_parent']) as BasicResolvedDataItem;
        } else if (type === strings.TYPE_TREE_TO_LIST) {
            publicItem = omit(item, ['_path', '_isLeaf']) as BasicResolvedDataItem;
        }
        const fullPath = TransferFoundation.getFullPath(item, type, showPath);
        return fullPath ? { ...publicItem, fullPath } : publicItem;
    }

    /** The treeList path label shown with `showPath`, e.g. "Asia > China > Shanghai" */
    static generatePath({ _path = [] }: BasicResolvedDataItem) {
        return _path.map((p) => p.label).join(' > ');
    }

    handleInputChange = (inputVal: string, notify: boolean) => {
        if (this.getProp('type') === strings.TYPE_TREE_TO_LIST) {
            this.adapter.searchTree(inputVal);
        }
        if (notify) {
            this.adapter.notifySearch(inputVal);
        }
        this.adapter.updateInput(inputVal);
        // via handlePageChange so a controlled caller is told to move
        if (TransferFoundation.getPageNumber(this.getProp('pagination'), this.getState('leftCurrentPage')) !== 1) {
            this.handlePageChange(1);
        }
    };

    handleAll = (wantAllChecked: boolean) => {
        const { disabled, type, filter } = this.getProps();
        if (disabled) {
            return;
        }
        const { inputValue } = this.getStates();
        const data = this.#getData();
        const selectedItems = this.#getSelected(data);
        let operateData = data;
        if (type === strings.TYPE_TREE_TO_LIST) {
            operateData = data.filter((item) => item._isLeaf);
        } else if (inputValue !== '') {
            const searchResult = TransferFoundation.getSearchResult(data, inputValue, filter, type);
            operateData = data.filter((item) => searchResult.has(item.key));
        }
        for (const item of operateData) {
            if (wantAllChecked && (!item.disabled || selectedItems.has(item.key))) {
                selectedItems.set(item.key, item);
            } else if (!wantAllChecked && !item.disabled) {
                selectedItems.delete(item.key);
            }
        }
        this.#updateSelected(selectedItems);
    };

    handleClear = () => {
        if (this.getProp('disabled')) {
            return;
        }
        const data = this.#getData();
        const selectedItems = this.#getSelected(data);
        for (const item of data) {
            if (!item.disabled) {
                selectedItems.delete(item.key);
            }
        }
        this.#updateSelected(selectedItems);
    };

    handleSelectOrRemove = (item: BasicResolvedDataItem) => {
        if (this.getProp('disabled') || item.disabled) {
            return;
        }
        const selectedItems = this.#getSelected(this.#getData());
        const changedItem = this.#injectFullPath(item);
        if (selectedItems.has(item.key)) {
            selectedItems.delete(item.key);
            this.adapter.notifyDeselect(changedItem);
        } else {
            selectedItems.set(item.key, item);
            this.adapter.notifySelect(changedItem);
        }
        this.#updateSelected(selectedItems);
    };

    handleSelect = (values: BasicTreeValue) => {
        if (this.getProp('disabled')) {
            return;
        }
        const data = this.#getData();
        const selectedItems = this.#getSelected(data);
        const allItemsMap = new Map(data.map((d) => [d.value, d]));
        const nextSelectedItemsMap: DataItemMap = new Map();
        (values as Array<number | string>).forEach((value) => {
            const node = allItemsMap.get(value);
            if (selectedItems.has(node.key) || !node.disabled) {
                nextSelectedItemsMap.set(node.key, node);
            }
        });
        this.#updateSelected(nextSelectedItemsMap);
    };

    /**
     * `value` went back to a non-array (a form reset). The state still holds what was selected before `value` took
     * over, since a controlled selection never writes it, so it returns to the initial selection.
     */
    handleValueRelease = () => {
        this.adapter.updateSelected([...(this.getProp('defaultValue') ?? [])]);
    };

    /**
     * A focusout from the root or anything inside it: reports the blur once the focus has left the whole transfer.
     * A window blur has no relatedTarget and counts as leaving, as in TreeSelect.
     */
    handleFocusOut = (e: E & Pick<FocusEvent, 'currentTarget' | 'relatedTarget'>) => {
        const { currentTarget, relatedTarget } = e;
        if (!(currentTarget instanceof Node && relatedTarget instanceof Node && currentTarget.contains(relatedTarget))) {
            this.adapter.notifyBlur(e);
        }
    };

    handleSortEnd = ({ oldIndex, newIndex }: OnSortEndProps) => {
        if (this.getProp('disabled')) {
            return;
        }
        const selectedArr = arrayMove([...this.#getSelected(this.#getData()).values()], oldIndex, newIndex);
        this.#updateSelected(new Map(selectedArr.map((option) => [option.key, option])));
    };

    handlePageChange = (currentPage: number) => {
        this.adapter.updateCurrentPage(currentPage);
        this.adapter.notifyPageChange(currentPage);
    };
}
