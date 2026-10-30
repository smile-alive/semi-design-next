import BaseFoundation, { type DefaultAdapter, type DirectionContext } from '../base/foundation';
import { handlePrevent, getListTargetIndex, getMenuButton, setFocusToItem, Typeahead } from '../utils/a11y';
import { strings } from './constants';

const { ITEM_SELECTOR } = strings;

export type DropdownSelectionMode = 'single' | 'multiple';

/**
 * Role and checked state of a menu item, from the menu's selectionMode (as React Aria Menu) and showTick. Without a
 * selectionMode a tick shows a checked state, so showTick alone makes the items checkboxes.
 */
export function getItemRole(selectionMode?: DropdownSelectionMode, showTick?: boolean) {
    if (selectionMode === 'single') {
        return 'menuitemradio';
    }
    return selectionMode === 'multiple' || showTick ? 'menuitemcheckbox' : 'menuitem';
}

/**
 * What a Dropdown provides to everything inside its popup, read by the menus there and by a Dropdown whose trigger is
 * one of their items. A framework adapter passes it as the foundation context, with the reading direction added.
 */
export interface DropdownMenuContext extends DirectionContext {
    /** How many menus enclose this point: 1 inside a top-level menu, 0 outside any menu */
    menuDepth?: number;
    showTick?: boolean;
    /** Not inherited: a submenu takes its own Dropdown's value */
    selectionMode?: DropdownSelectionMode;
    trigger?: string;
    /** Closes the popup that renders the menu, without moving focus */
    close?: () => void;
    /** Closes that popup and the popups of every enclosing menu */
    closeAll?: () => void;
    /** Id of the popup that renders the menu; its trigger carries it as data-popupid */
    getPopupId?: () => string;
}

/** The adapter of a foundation that reads DropdownMenuContext */
export interface DropdownContextAdapter<P = object, S = object> extends DefaultAdapter<P, S, DropdownMenuContext> {}

/**
 * Keyboard of a menu (WAI-ARIA APG menu pattern): arrows, Home and End move focus between the enabled items of this
 * menu, Enter and Space activate the focused item, Left (Right in RTL) closes a submenu. Opening a submenu is handled
 * by the Dropdown whose trigger is the parent item.
 */
export default class DropdownMenuFoundation<P extends object = object, S extends object = object> extends BaseFoundation<DropdownContextAdapter<P, S>, P, S> {
    readonly #typeahead = new Typeahead();

    #focusMenuButton(menu: Element) {
        getMenuButton(this._adapter.getContext('getPopupId')?.() ?? '', menu.getRootNode() as ParentNode)?.focus();
    }

    // read on every keydown: items may be added, removed or disabled while the menu is open
    #getItems(menu: Element) {
        return [...menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter((item) => item.closest('[role="menu"]') === menu && item.getAttribute('aria-disabled') !== 'true');
    }

    onMenuKeydown = (event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'currentTarget' | 'defaultPrevented' | 'key' | 'metaKey' | 'preventDefault' | 'stopPropagation' | 'target'>) => {
        const { currentTarget: menu, target } = event;
        if (!(menu instanceof Element) || !(target instanceof HTMLElement)) {
            return;
        }
        // a submenu's keys were handled by the submenu and its own popup; the parent menu must not act on them again.
        // Escape goes on to the document, where the overlay stack closes the submenu.
        if (target.closest('[role="menu"]') !== menu) {
            if (event.key !== 'Escape') {
                event.stopPropagation();
            }
            return;
        }
        const items = this.#getItems(menu);
        const index = items.findIndex((item) => item.contains(target));
        const isRtl = this._adapter.getContext('direction') === 'rtl';
        // a top-level menu is at depth 1
        const isSubmenu = this._adapter.getContext('menuDepth') > 1;

        switch (event.key) {
            case ' ':
            case 'Enter':
                // an item's own onKeyDown cancels the activation with preventDefault, as for a native button
                if (index >= 0 && items[index] === target && !event.defaultPrevented) {
                    // Space would scroll the page; Enter's keypress goes to whatever has focus after the click, so an
                    // item that opens a Modal would also press the dialog's first button
                    event.preventDefault();
                    target.click();
                }
                // a trigger may be an input with its own key handling, so the event keeps propagating
                break;
            case 'Escape':
                // the popup returns focus to its trigger itself, except a custom one, which the page shows and hides
                if (this._adapter.getContext('trigger') === 'custom') {
                    this.#focusMenuButton(menu);
                }
                break;
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Home':
            case 'End': {
                // the items are already the enabled ones, so nothing is skipped
                const next = getListTargetIndex(event.key, index, items.length, () => false, { loop: true });
                if (next !== null) {
                    setFocusToItem(items, items[next]);
                }
                handlePrevent(event);
                break;
            }
            case 'ArrowLeft':
            case 'ArrowRight':
                if (isSubmenu && event.key === (isRtl ? 'ArrowRight' : 'ArrowLeft')) {
                    handlePrevent(event);
                    // focus first: closing a hover or focus popup while the trigger is unfocused would reopen it later
                    this.#focusMenuButton(menu);
                    this._adapter.getContext('close')?.();
                }
                break;
            case 'Tab': {
                // APG: Tab closes every menu and moves focus on from the outermost trigger. The popups sit at the end
                // of the body, so the browser has to start from that trigger. A submenu's trigger is an item of the
                // parent menu, whose own trigger is looked up in turn.
                const root = menu.getRootNode() as ParentNode;
                let button = getMenuButton(this._adapter.getContext('getPopupId')?.() ?? '', root);
                while (button?.matches(ITEM_SELECTOR)) {
                    button = getMenuButton(button.closest('[popover]')?.id ?? '', root);
                }
                button?.focus();
                this._adapter.getContext('closeAll')?.();
                break;
            }
            default:
                if (this.#typeahead.accepts(event)) {
                    const labels = items.map((item) => item.textContent);
                    const found = this.#typeahead.match(event.key, labels, index);
                    if (found >= 0) {
                        setFocusToItem(items, items[found]);
                    }
                    // it can be an input on Dropdown, handlePrevent may affect the input of the component
                }
                break;
        }
    };
}
