import { isEqual } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';
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

export interface NavigationView {
    isCollapsed: boolean;
    openKeysIsControlled: boolean;
    openKeys: ItemKey[];
    selectedKeys: ItemKey[];
}

export interface NavigationAdapter<P extends NavigationBaseProps = NavigationBaseProps> extends DefaultAdapter<P, NavigationState> {
    getItemsFromChildren(): NavItemType[];
    notifyCollapseChange(isCollapsed: boolean): void;
}

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

export default class NavigationFoundation<P extends NavigationBaseProps = NavigationBaseProps> extends BaseFoundation<NavigationAdapter<P>, P, NavigationState> {
    static override readonly propKeys = ['items', 'children', 'selectedKeys', 'openKeys'];
    static override readonly propEquals = { selectedKeys: isEqual, openKeys: isEqual };

    static #getIsCollapsed(props: NavigationBaseProps, state: NavigationState) {
        if (props.mode === strings.MODE_HORIZONTAL) {
            return false;
        }
        return props.isCollapsed === undefined ? state.isCollapsed : props.isCollapsed;
    }

    #getItemKeysMap() {
        return NavigationFoundation.getFormattedItems(this.getProps(), this.adapter.getItemsFromChildren()).itemKeysMap;
    }

    // unchanged values are not written, so a parent re-rendering with identical content costs no second render;
    // defaults seed only the initial state, so a rebuild keeps the user's current selection and expansion
    #rebuild() {
        const props = this.getProps();
        const itemKeysMap = this.#getItemKeysMap();
        const willSelectedKeys: ItemKey[] = props.selectedKeys || this.getState('selectedKeys');
        const selectedKeys = Array.from(new Set(willSelectedKeys.concat(NavigationFoundation.getZeroParentKeys(itemKeysMap, ...willSelectedKeys))));
        const willOpenKeys = NavigationFoundation.getNextOpenKeys(props, this.getState('openKeys'), itemKeysMap, selectedKeys);
        if (!isEqual(selectedKeys, this.getState('selectedKeys'))) {
            this.setState({ selectedKeys });
        }
        if (!isEqual(willOpenKeys, this.getState('openKeys'))) {
            this.setState({ openKeys: willOpenKeys });
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

    /** openKeys when given; otherwise the current open keys, plus in vertical mode every ancestor of the selected keys */
    static getNextOpenKeys({ openKeys, mode }: NavigationBaseProps, stateOpenKeys: ItemKey[], itemKeysMap: ItemKey2ParentKeysMap, selectedKeys: ItemKey[]) {
        if (Array.isArray(openKeys)) {
            return [...openKeys];
        }
        if (mode === strings.MODE_VERTICAL) {
            return Array.from(new Set(stateOpenKeys.concat(NavigationFoundation.getShouldOpenKeys(itemKeysMap, selectedKeys))));
        }
        return [...stateOpenKeys];
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

    /**
     * What the hosts render: openKeys is controlled only while the nav is vertical and expanded, and a given
     * selectedKeys (null reads as empty) also selects the top-level ancestor of each key
     */
    static deriveView(props: NavigationBaseProps, state: NavigationState, itemKeysMap: ItemKey2ParentKeysMap): NavigationView {
        const isCollapsed = NavigationFoundation.#getIsCollapsed(props, state);
        const openKeysIsControlled = props.openKeys !== undefined && props.mode === strings.MODE_VERTICAL && !isCollapsed;
        const givenSelectedKeys: ItemKey[] = props.selectedKeys ?? [];
        return {
            isCollapsed,
            openKeysIsControlled,
            openKeys: openKeysIsControlled ? (props.openKeys ?? []) : state.openKeys,
            selectedKeys: props.selectedKeys === undefined ? state.selectedKeys : givenSelectedKeys.concat(NavigationFoundation.getZeroParentKeys(itemKeysMap, ...givenSelectedKeys)),
        };
    }

    // a popup list is driven by its Dropdown, not by openKeys
    /** The nav's own `width` transition ended; transitions of its descendants bubble up here too */
    static isWidthTransitionEnd({ target, currentTarget, propertyName }: Pick<TransitionEvent, 'target' | 'currentTarget' | 'propertyName'>) {
        return target === currentTarget && propertyName === 'width';
    }

    /**
     * Whether the nav is running a `width` transition. No transitionend comes when the width does not animate
     * (transition off, fixed width, hidden); `getAnimations` flushes style, so right after a commit it lists that
     * commit's transition.
     */
    static isWidthAnimating(nav?: Element | null) {
        return Boolean(nav?.getAnimations().some((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'width'));
    }

    /**
     * New items or children rebuild the menu from the props, otherwise a changed (deep compared) selectedKeys or
     * openKeys is copied into state
     */
    override handlePropsChange(prev: Partial<P>) {
        const props = this.getProps();
        if (prev.items !== props.items || prev.children !== props.children) {
            this.#rebuild();
            return;
        }
        if (props.selectedKeys && !isEqual(prev.selectedKeys, props.selectedKeys)) {
            this.updateSelectedKeys(props.selectedKeys);
            this.setState({ openKeys: NavigationFoundation.getNextOpenKeys(props, this.getState('openKeys'), this.#getItemKeysMap(), props.selectedKeys) });
        } else if (prev.selectedKeys !== undefined && props.selectedKeys === undefined) {
            this.setState({ selectedKeys: [] });
        }
        if (props.openKeys && !isEqual(prev.openKeys, props.openKeys)) {
            this.setState({ openKeys: props.openKeys });
        } else if (prev.openKeys !== undefined && props.openKeys === undefined) {
            this.setState({ openKeys: NavigationFoundation.getWillOpenKeys(props, [], this.#getItemKeysMap()) });
        }
    }

    // The four handlers below are arrow properties: a host hands them out as context values, and a stable identity keeps
    // memoized consumers from re-rendering.

    updateSelectedKeys = (keys: ItemKey[]) => {
        const parentKeys = NavigationFoundation.getZeroParentKeys(this.#getItemKeysMap(), ...keys);
        this.setState({ selectedKeys: Array.from(new Set(keys.concat(parentKeys))) });
    };

    addOpenKey = (itemKey: ItemKey) => {
        const openKeys = new Set<ItemKey>(this.getState('openKeys'));
        if (itemKey != null) {
            openKeys.add(itemKey);
        }
        this.setState({ openKeys: Array.from(openKeys) });
    };

    removeOpenKey = (itemKey: ItemKey) => {
        const openKeys = new Set<ItemKey>(this.getState('openKeys'));
        if (itemKey != null) {
            openKeys.delete(itemKey);
        }
        this.setState({ openKeys: Array.from(openKeys) });
    };

    handleCollapseChange = () => {
        const isCollapsed = !NavigationFoundation.#getIsCollapsed(this.getProps(), this.getStates());

        if (!this.isControlledComponent('isCollapsed')) {
            this.setState({ isCollapsed });
        }
        this.adapter.notifyCollapseChange(isCollapsed);
    };
}
