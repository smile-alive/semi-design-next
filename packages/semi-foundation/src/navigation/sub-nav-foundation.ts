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
    handleDropdownVisibleChange(visible: boolean) {
        const itemKey = this.getProp('itemKey');
        const rawOpenKeys = this._adapter.getOpenKeys();
        const openKeys = visible ? addKeys(rawOpenKeys, itemKey) : removeKeys(rawOpenKeys, itemKey);

        // a list in a Dropdown is never driven by the openKeys prop
        this._adapter.updateOpen(visible);

        this._adapter.notifyGlobalOpenChange({ itemKey, openKeys, isOpen: visible });
    }

    handleClick(e: MouseEvent | KeyboardEvent) {
        const { itemKey, disabled } = this.getProps();
        if (disabled) {
            return;
        }
        const isOpen = !this._adapter.getIsOpen();

        const openKeys = isOpen ? addKeys(this._adapter.getOpenKeys(), itemKey) : removeKeys(this._adapter.getOpenKeys(), itemKey);

        const cbVal = { itemKey, openKeys, isOpen, domEvent: e };

        if (!this._adapter.getOpenKeysIsControlled()) {
            this._adapter.updateOpen(isOpen);
        }
        this._adapter.notifyGlobalOpenChange(cbVal);
        this._adapter.notifyGlobalOnClick(cbVal);
    }

    /**
     * Only reports the click: the Dropdown owns the open state and reports it through handleDropdownVisibleChange,
     * so toggling here would emit a second, possibly contradictory openChange.
     */
    handlePopupClick(e: MouseEvent | KeyboardEvent) {
        const { itemKey, disabled } = this.getProps();
        if (disabled) {
            return;
        }
        this._adapter.notifyGlobalOnClick({
            itemKey,
            openKeys: this._adapter.getOpenKeys(),
            isOpen: this._adapter.getIsOpen(),
            domEvent: e,
        });
    }
}
