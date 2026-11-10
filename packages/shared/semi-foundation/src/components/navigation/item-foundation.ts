import { cloneDeepWith, isPlainObject } from 'es-toolkit';
import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { strings } from './constants';

export interface ItemProps {
    text?: any;
    itemKey?: any;
    icon?: any;
    toggleIcon?: unknown;
    indent?: boolean;
    isCollapsed?: boolean;
    isSubNav?: boolean;
    link?: string;
    linkOptions?: Record<string, any>;
    disabled?: boolean;
}

export type ItemKey = string | number;

export interface SelectedItemProps<Props = ItemProps> {
    itemKey: ItemKey;
    text?: any;
    selectedKeys?: ItemKey[];
    selectedItems?: Props[];
    domEvent?: MouseEvent | KeyboardEvent;
}

export interface ItemAdapter<P extends ItemProps = ItemProps, S extends object = object> extends DefaultAdapter<P, S> {
    /**
     * The entry `onSelect` reports in `selectedItems`, made with `copySelectedItem`: for an `items` entry the whole
     * config plus `level`, otherwise every prop the item was given
     */
    getSelectedItem(): P;
    selectSelf(): void;
    getSelectedKeysIsControlled(): boolean;
    notifyGlobalOnSelect(item: SelectedItemProps<P>): void;
    notifyGlobalOnClick(item: SelectedItemProps<P>): void;
    notifyClick(item: SelectedItemProps<P>): void;
    getSelected(): boolean;
}

const copiedTypes = [Date, Map, Set, RegExp];

/**
 * The copy `onSelect` reports in `selectedItems`: plain objects, arrays, `Date`, `Map`, `Set` and `RegExp` are copied
 * deeply, everything else (functions, DOM nodes, other class instances) is kept by reference. Framework elements that are
 * plain objects (React elements, Vue VNodes) are kept too, which `isElement` recognizes.
 */
export function copySelectedItem<T>(item: T, isElement: (value: unknown) => boolean = () => false): T {
    const copied = (value: unknown) => (isPlainObject(value) && !isElement(value)) || Array.isArray(value) || copiedTypes.some((type) => value instanceof type);
    return cloneDeepWith(item, (value) => (copied(value) ? undefined : value));
}

/** Blank icon slots that indent an item `level` lists deep: each nesting level adds one */
export function countPlaceholderIcons({ mode, limitIndent, isCollapsed, hasIcon, indent, level }: { mode?: string; limitIndent?: boolean; isCollapsed?: boolean; hasIcon: boolean; indent: boolean; level: number }) {
    if (mode !== strings.MODE_VERTICAL || limitIndent || isCollapsed) {
        return 0;
    }
    return Math.max(hasIcon && !indent ? level : level - 1, 0);
}

export default class ItemFoundation<P extends ItemProps = ItemProps, S extends object = object> extends BaseFoundation<ItemAdapter<P, S>, P, S> {
    protected isValidKey(itemKey: string) {
        return itemKey != null && (typeof itemKey === 'string' || typeof itemKey === 'number');
    }

    handleClick = (e: MouseEvent | KeyboardEvent) => {
        const { isSubNav, itemKey, text, disabled } = this.getProps();

        if (disabled) {
            return;
        }

        // read before selectSelf: a state readable right after a write would otherwise skip onSelect
        const wasSelected = this.adapter.getSelected();

        if (!isSubNav && this.isValidKey(itemKey) && !this.adapter.getSelectedKeysIsControlled() && !wasSelected) {
            this.adapter.selectSelf();
        }

        const selectedKeys = [itemKey];

        // a SubNav triggers the click event itself
        if (!isSubNav) {
            if (!wasSelected) {
                this.adapter.notifyGlobalOnSelect({ itemKey, selectedKeys, selectedItems: [this.adapter.getSelectedItem()], domEvent: e });
            }
            this.adapter.notifyGlobalOnClick({ itemKey, text, domEvent: e });
        }
        this.adapter.notifyClick({ itemKey, text, domEvent: e });
    };
}
