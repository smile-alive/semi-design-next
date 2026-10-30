import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

function addKeys(originKeys: (string | number)[] = [], ...willAddKeys: (string | number)[]) {
    const keySet = new Set(originKeys);
    willAddKeys.forEach((key) => key != null && keySet.add(key));
    return Array.from(keySet);
}

function removeKeys(originKeys: (string | number)[] = [], ...willRemoveKeys: (string | number)[]) {
    const keySet = new Set(originKeys);
    willRemoveKeys.forEach((key) => key != null && keySet.delete(key));
    return Array.from(keySet);
}

export interface OnOpenChangeData {
    itemKey: string | number;
    openKeys: (string | number)[];
    isOpen: boolean;
}

export interface OnClickData extends OnOpenChangeData {
    domEvent: MouseEvent | KeyboardEvent;
}

export interface SubNavAdapter<P extends SubNavBaseProps = SubNavBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    getOpenKeys(): (string | number)[];
    getOpenKeysIsControlled(): boolean;
    updateOpen(isOpen: boolean): void;
    notifyGlobalOpenChange(data: OnOpenChangeData): void;
    notifyGlobalOnClick(data: OnClickData): void;
    getIsOpen(): boolean;
}

/** The props the foundation reads */
export interface SubNavBaseProps {
    itemKey?: string | number;
    disabled?: boolean;
}

export default class SubNavFoundation<P extends SubNavBaseProps = SubNavBaseProps, S extends object = object> extends BaseFoundation<SubNavAdapter<P, S>, P, S> {
    handleDropdownVisibleChange = (visible: boolean) => {
        const itemKey = this.getProp('itemKey');
        const rawOpenKeys = this.adapter.getOpenKeys();
        const openKeys = visible ? addKeys(rawOpenKeys, itemKey) : removeKeys(rawOpenKeys, itemKey);

        // a list in a Dropdown is never driven by the openKeys prop
        this.adapter.updateOpen(visible);

        this.adapter.notifyGlobalOpenChange({ itemKey, openKeys, isOpen: visible });
    };

    handleClick = (e: MouseEvent | KeyboardEvent) => {
        const { itemKey, disabled } = this.getProps();
        if (disabled) {
            return;
        }
        const isOpen = !this.adapter.getIsOpen();

        const openKeys = isOpen ? addKeys(this.adapter.getOpenKeys(), itemKey) : removeKeys(this.adapter.getOpenKeys(), itemKey);

        const cbVal = { itemKey, openKeys, isOpen, domEvent: e };

        if (!this.adapter.getOpenKeysIsControlled()) {
            this.adapter.updateOpen(isOpen);
        }
        this.adapter.notifyGlobalOpenChange(cbVal);
        this.adapter.notifyGlobalOnClick(cbVal);
    };

    /**
     * Only reports the click: the Dropdown owns the open state and reports it through handleDropdownVisibleChange,
     * so toggling here would emit a second, possibly contradictory openChange.
     */
    handlePopupClick = (e: MouseEvent | KeyboardEvent) => {
        const { itemKey, disabled } = this.getProps();
        if (disabled) {
            return;
        }
        this.adapter.notifyGlobalOnClick({
            itemKey,
            openKeys: this.adapter.getOpenKeys(),
            isOpen: this.adapter.getIsOpen(),
            domEvent: e,
        });
    };
}
