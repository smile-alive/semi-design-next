import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from './constants';
import type { ItemKey } from './item-foundation';

export interface ItemKey2ParentKeysMap {
    [key: string]: (string | number)[];
}

/** An item as the user writes it: a string is the text and the key of a plain item */
export interface NavItemInput {
    items?: (string | NavItemInput)[];
    [key: string]: any;
}

/** An item after formatting or normalization by the framework adapter */
export interface NavItemType {
    items?: NavItemType[];
    [key: string]: any;
}

export interface NavigationState {
    isCollapsed: boolean;
    openKeys: ItemKey[];
    selectedKeys: ItemKey[];
}

export interface NavigationAdapter<P extends NavigationBaseProps = NavigationBaseProps, S extends NavigationState = NavigationState> extends DefaultAdapter<P, S> {
    getItemsFromChildren(): NavItemType[];
    setIsCollapsed(isCollapsed: boolean): void;
    notifyCollapseChange(isCollapsed: boolean): void;
    updateSelectedKeys(keys: ItemKey[]): void;
    updateOpenKeys(keys: ItemKey[]): void;
}

/** The props the foundation reads */
export interface NavigationBaseProps {
    items?: (string | NavItemInput)[];
    children?: unknown;
    selectedKeys?: ItemKey[];
    defaultSelectedKeys?: ItemKey[];
    openKeys?: ItemKey[];
    defaultOpenKeys?: ItemKey[];
    isCollapsed?: boolean;
    defaultIsCollapsed?: boolean;
    mode?: string;
}

export default class NavigationFoundation<P extends NavigationBaseProps = NavigationBaseProps, S extends NavigationState = NavigationState> extends BaseFoundation<NavigationAdapter<P, S>, P, S> {
    #getItemKeysMap() {
        return NavigationFoundation.getFormattedItems(this.getProps(), this.adapter.getItemsFromChildren()).itemKeysMap;
    }

    // unchanged values are not written, so a parent re-rendering with identical content costs no second render
    #rebuild() {
        const props = this.getProps();
        const itemKeysMap = this.#getItemKeysMap();
        const willOpenKeys = NavigationFoundation.getWillOpenKeys(props, this.getState('openKeys'), itemKeysMap);
        const willSelectedKeys: ItemKey[] = props.selectedKeys || props.defaultSelectedKeys || [];
        const selectedKeys = willSelectedKeys.concat(NavigationFoundation.getZeroParentKeys(itemKeysMap, ...willSelectedKeys));
        if (!isEqual(selectedKeys, this.getState('selectedKeys'))) {
            this.adapter.updateSelectedKeys(selectedKeys);
        }
        if (!isEqual(willOpenKeys, this.getState('openKeys'))) {
            this.adapter.updateOpenKeys(willOpenKeys);
        }
    }

    static getZeroParentKeys(itemKeysMap: ItemKey2ParentKeysMap = {}, ...itemKeys: ItemKey[]) {
        const willAddKeys = [];
        if (itemKeys.length) {
            for (const itemKey of itemKeys) {
                if (Array.isArray(itemKeysMap[itemKey]) && itemKeysMap[itemKey].length) {
                    const levelZeroParentKey = itemKeysMap[itemKey][0];
                    if (levelZeroParentKey != null) {
                        willAddKeys.push(levelZeroParentKey);
                    }
                }
            }
        }

        return willAddKeys;
    }

    static buildItemKeysMap(items: NavItemType[] = [], keysMap = {}, parentKeys: (string | number)[] = [], keyPropName = 'itemKey') {
        if (Array.isArray(items) && items.length) {
            for (const item of items) {
                if (Array.isArray(item)) {
                    NavigationFoundation.buildItemKeysMap(item, keysMap, [...parentKeys], keyPropName);
                } else {
                    let itemKey;
                    if (item && typeof item === 'object') {
                        itemKey = item[keyPropName];
                    }
                    if (itemKey != null) {
                        keysMap[itemKey] = [...parentKeys];
                        if (Array.isArray(item.items) && item.items.length) {
                            NavigationFoundation.buildItemKeysMap(item.items, keysMap, [...parentKeys, itemKey], keyPropName);
                        }
                    }
                }
            }
        }

        return keysMap;
    }

    static formatItems(items: (string | NavItemInput)[] = []): NavItemType[] {
        return items.map((item) => {
            if (item == null || typeof item !== 'object') {
                return { text: item, itemKey: item };
            }
            const { items: nested, ...rest } = item;
            return Array.isArray(nested) ? { ...rest, items: NavigationFoundation.formatItems(nested) } : rest;
        });
    }

    /**
     * Formatted items and the itemKey -> parent keys map
     */
    static getFormattedItems({ items }: NavigationBaseProps, children: NavItemType[] = []) {
        const formattedItems = NavigationFoundation.formatItems(items);
        const willHandleItems = Array.isArray(items) && items.length ? formattedItems : children;
        const itemKeysMap: ItemKey2ParentKeysMap = NavigationFoundation.buildItemKeysMap(willHandleItems);
        return { itemKeysMap, formattedItems };
    }

    static getShouldOpenKeys(itemKeysMap: ItemKey2ParentKeysMap = {}, selectedKeys: ItemKey[] = []) {
        const willOpenKeySet = new Set<ItemKey>();

        if (Array.isArray(selectedKeys) && selectedKeys.length) {
            selectedKeys.forEach((item) => {
                if (item != null) {
                    const parentKeys = itemKeysMap[item];

                    if (Array.isArray(parentKeys)) {
                        parentKeys.forEach((k) => willOpenKeySet.add(k));
                    }
                }
            });
        }

        return [...willOpenKeySet];
    }

    /**
     * openKeys or defaultOpenKeys when given; otherwise, in vertical mode with selected keys, the current open keys
     * plus every ancestor of the selected keys
     */
    static getWillOpenKeys({ defaultOpenKeys, openKeys, defaultSelectedKeys, selectedKeys, mode }: NavigationBaseProps, stateOpenKeys: ItemKey[] = [], itemKeysMap: ItemKey2ParentKeysMap) {
        let willOpenKeys = openKeys || defaultOpenKeys || [];
        if (!(Array.isArray(defaultOpenKeys) || Array.isArray(openKeys)) && mode === strings.MODE_VERTICAL && (Array.isArray(defaultSelectedKeys) || Array.isArray(selectedKeys))) {
            const currentSelectedKeys = Array.isArray(selectedKeys) ? selectedKeys : defaultSelectedKeys;
            willOpenKeys = stateOpenKeys.concat(NavigationFoundation.getShouldOpenKeys(itemKeysMap, currentSelectedKeys));
            willOpenKeys = Array.from(new Set(willOpenKeys));
        }
        return [...willOpenKeys];
    }

    static getInitialState(props: NavigationBaseProps, children: NavItemType[] = []) {
        const { isCollapsed, defaultIsCollapsed, items, selectedKeys, defaultSelectedKeys } = props;
        const state: NavigationState = {
            isCollapsed: Boolean(isCollapsed === undefined ? defaultIsCollapsed : isCollapsed),
            openKeys: [],
            selectedKeys: [],
        };
        if (!((items && items.length) || props.children || children.length)) {
            return state;
        }
        const { itemKeysMap } = NavigationFoundation.getFormattedItems(props, children);
        const willSelectedKeys: ItemKey[] = selectedKeys || defaultSelectedKeys || [];
        return {
            ...state,
            selectedKeys: willSelectedKeys.concat(NavigationFoundation.getZeroParentKeys(itemKeysMap, ...willSelectedKeys)),
            openKeys: NavigationFoundation.getWillOpenKeys(props, state.openKeys, itemKeysMap),
        };
    }

    static getIsCollapsed(props: NavigationBaseProps, state: NavigationState) {
        if (props.mode === strings.MODE_HORIZONTAL) {
            return false;
        }
        return props.isCollapsed === undefined ? state.isCollapsed : props.isCollapsed;
    }

    static getSelectedKeys(props: NavigationBaseProps, state: NavigationState, itemKeysMap: ItemKey2ParentKeysMap) {
        if (props.selectedKeys === undefined) {
            return state.selectedKeys;
        }
        const selectedKeys: ItemKey[] = props.selectedKeys ?? [];
        return selectedKeys.concat(NavigationFoundation.getZeroParentKeys(itemKeysMap, ...selectedKeys));
    }

    // a popup list is driven by its Dropdown, not by openKeys
    static isOpenKeysControlled(props: NavigationBaseProps, isCollapsed: boolean) {
        return props.openKeys !== undefined && props.mode === strings.MODE_VERTICAL && !isCollapsed;
    }

    static getOpenKeys(props: NavigationBaseProps, state: NavigationState, isCollapsed: boolean) {
        return NavigationFoundation.isOpenKeysControlled(props, isCollapsed) ? (props.openKeys ?? []) : state.openKeys;
    }

    /**
     * New items or children rebuild the menu from the props, otherwise a changed (deep compared) selectedKeys or
     * openKeys is copied into state
     */
    handlePropsUpdate = (prevProps: NavigationBaseProps) => {
        const props = this.getProps();
        if (prevProps.items !== props.items || prevProps.children !== props.children) {
            this.#rebuild();
            return;
        }
        if (props.selectedKeys && !isEqual(prevProps.selectedKeys, props.selectedKeys)) {
            this.updateSelectedKeys(props.selectedKeys);
            this.adapter.updateOpenKeys(NavigationFoundation.getWillOpenKeys(props, this.getState('openKeys'), this.#getItemKeysMap()));
        } else if (prevProps.selectedKeys !== undefined && props.selectedKeys === undefined) {
            this.adapter.updateSelectedKeys([]);
        }
        if (props.openKeys && !isEqual(prevProps.openKeys, props.openKeys)) {
            this.adapter.updateOpenKeys(props.openKeys);
        } else if (prevProps.openKeys !== undefined && props.openKeys === undefined) {
            this.adapter.updateOpenKeys(NavigationFoundation.getWillOpenKeys(props, [], this.#getItemKeysMap()));
        }
    };

    // The four handlers below are arrow properties: a host hands them out as context values, and a stable identity keeps
    // memoized consumers from re-rendering.

    /**
     * Selects keys together with their top level parents
     */
    updateSelectedKeys = (keys: ItemKey[]) => {
        const parentKeys = NavigationFoundation.getZeroParentKeys(this.#getItemKeysMap(), ...keys);
        this.adapter.updateSelectedKeys(Array.from(new Set(keys.concat(parentKeys))));
    };

    addOpenKey = (itemKey: ItemKey) => {
        const openKeys = new Set<ItemKey>(this.getState('openKeys'));
        if (itemKey != null) {
            openKeys.add(itemKey);
        }
        this.adapter.updateOpenKeys(Array.from(openKeys));
    };

    removeOpenKey = (itemKey: ItemKey) => {
        const openKeys = new Set<ItemKey>(this.getState('openKeys'));
        if (itemKey != null) {
            openKeys.delete(itemKey);
        }
        this.adapter.updateOpenKeys(Array.from(openKeys));
    };

    handleCollapseChange = () => {
        const isCollapsed = !NavigationFoundation.getIsCollapsed(this.getProps(), this.getStates());

        if (!this.isControlledComponent('isCollapsed')) {
            this.adapter.setIsCollapsed(isCollapsed);
        }
        this.adapter.notifyCollapseChange(isCollapsed);
    };
}
