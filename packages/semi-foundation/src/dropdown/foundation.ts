import BaseFoundation from '../base/foundation';
import { getMenuButton, handlePrevent, isTextEditor, setFocusToFirstItem, setFocusToLastItem } from '../utils/a11y';
import FocusTrapHandle from '../utils/focus-handle';
import { strings } from './constants';
import type { DropdownContextAdapter } from './menu-foundation';

/** The context is the one around the Dropdown: a Dropdown inside a menu reads that menu's DropdownMenuContext */
export interface DropdownAdapter<P extends DropdownBaseProps = DropdownBaseProps, S extends DropdownBaseState = DropdownBaseState> extends DropdownContextAdapter<P, S> {
    setPopVisible(visible: boolean): void;
    notifyVisibleChange(visible: boolean): void;
    /** The Tooltip popup element (`[popover]`), null while it is not in the document */
    getPopup(): HTMLElement | null;
    /** Hides the popup through Tooltip's hide(), without moving focus: a controlled one only reports the request */
    hidePopup(): void;
}

/** The members of a keyboard event the foundation reads; DOM events and React synthetic events both satisfy it */
type DropdownKeyEvent = Pick<KeyboardEvent, 'defaultPrevented' | 'key' | 'preventDefault' | 'stopPropagation' | 'target'>;

const { ITEM_SELECTOR } = strings;
// elements the browser clicks on both Enter and Space
const NATIVE_KEY_CLICK_SELECTOR = 'button, summary, input[type="button"], input[type="submit"], input[type="reset"]';

/** The props the foundation reads */
export interface DropdownBaseProps {
    trigger?: string;
    visible?: boolean;
}

/** The state the foundation reads */
export interface DropdownBaseState {
    popVisible: boolean;
}

export default class DropdownFoundation<P extends DropdownBaseProps = DropdownBaseProps, S extends DropdownBaseState = DropdownBaseState> extends BaseFoundation<DropdownAdapter<P, S>, P, S> {
    // a menu asked to open from the keyboard gets focus on this item once it is shown
    #focusOnOpen: 'first' | 'last' | null = null;

    #focusEdgeItem(popup: HTMLElement | null, edge: 'first' | 'last') {
        const items = this.#getMenuItemNodes(popup);
        if (edge === 'first') {
            setFocusToFirstItem(items);
        } else {
            setFocusToLastItem(items);
        }
    }

    // the enabled items of the popup; a submenu renders in a popup of its own
    #getMenuItemNodes(popup: HTMLElement | null) {
        return popup ? [...popup.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter((item) => item.getAttribute('aria-disabled') !== 'true') : [];
    }

    // a controlled menu is open exactly when the owner says so; popVisible tracks only an uncontrolled one
    #isOpen(): boolean {
        return this.getProp('visible') ?? this.getState('popVisible');
    }

    // a Dropdown inside a menu is a submenu and its trigger is the parent item
    #handleParentItemKeyDown(event: DropdownKeyEvent, popup: HTMLElement | null) {
        const { target } = event;
        const popVisible = this.#isOpen();
        const openKey = this.adapter.getContext('direction') === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
        // a trigger that handled the key itself (Tag, Avatar) has already clicked and prevented the default
        const handled = event.defaultPrevented;
        switch (event.key) {
            case 'Enter':
            case ' ':
            case openKey:
                // like a menu item, the Enter is used up here and its keypress must not reach the newly focused item
                handlePrevent(event);
                if (popVisible) {
                    setFocusToFirstItem(this.#getMenuItemNodes(popup));
                } else {
                    this.#focusOnOpen = 'first';
                    const trigger = this.getProp('trigger');
                    if (trigger === 'click') {
                        if (!handled && target instanceof HTMLElement) {
                            target.click();
                        }
                    } else if ((trigger === 'hover' || trigger === 'focus') && target instanceof HTMLElement) {
                        // a hover or focus submenu opens on focus, which the item already has after Left or Escape
                        // closed the submenu, so the focus is given again
                        target.blur();
                        target.focus();
                    }
                }
                break;
            default:
                break;
        }
    }

    // Tooltip.destroy closes the popup without reporting it, as on unmount, so the trigger's open state is reset here;
    // otherwise a React Activity hide leaves aria-expanded="true" on a closed menu
    override destroy() {
        this.adapter.setPopVisible(false);
    }

    /** Closes the menu without moving focus */
    close = () => {
        this.adapter.hidePopup();
    };

    /** Tooltip's onVisibleChange: an actual change when uncontrolled, only a request to the owner when controlled */
    handleVisibleChange = (visible: boolean) => {
        if (this.getProp('visible') === undefined) {
            this.adapter.setPopVisible(visible);
        }
        if (!visible) {
            this.#focusOnOpen = null;
        }
        this.adapter.notifyVisibleChange(visible);
    };

    /**
     * Tooltip's initial focus of each opening, right after the popup is shown, controlled or not. Not deferred to
     * afterOpen: a keyboard user would wait out the enter animation.
     */
    handleOpened = () => {
        const popup = this.adapter.getPopup();
        const trigger = popup && getMenuButton(popup.id, popup.getRootNode() as ParentNode);
        // a key press that did not open the menu (disableFocusListener) must not pull focus away when the pointer
        // opens it later, so the request only holds while focus is still on the trigger
        const focusOnOpen = trigger?.contains(FocusTrapHandle.getActiveElement(trigger)) ? this.#focusOnOpen : null;
        // a contextMenu trigger is often an unfocusable area, so the menu is the only place keyboard focus can go
        if (['click', 'contextMenu'].includes(this.getProp('trigger')) || focusOnOpen) {
            this.#focusEdgeItem(popup, focusOnOpen ?? 'first');
        }
        this.#focusOnOpen = null;
    };

    /**
     * @param isMenuButton whether the trigger is a menu button: only then Up and Down open a closed menu
     */
    handleKeyDown = (event: DropdownKeyEvent, isMenuButton = false) => {
        const { target } = event;
        const popup = this.adapter.getPopup();
        // the trigger is an item of another menu, so this Dropdown opens a submenu
        const isSubmenu = this.adapter.getContext('menuDepth') > 0;
        if (isSubmenu) {
            this.#handleParentItemKeyDown(event, popup);
            return;
        }
        const popVisible = this.#isOpen();
        switch (event.key) {
            case ' ':
            case 'Enter':
                // in a text field a space is text and Enter submits its form; neither activates the trigger
                if (isTextEditor(target)) {
                    break;
                }
                // the browser already turns these keys into a click on a button; clicking here too runs its handlers twice.
                // A trigger that handled the key itself (Tag, Avatar) has already clicked and prevented the default.
                if (!event.defaultPrevented && target instanceof HTMLElement && !target.matches(NATIVE_KEY_CLICK_SELECTOR)) {
                    target.click();
                    // otherwise the same Enter also presses a button the click moved focus to
                    event.preventDefault();
                }
                // A trigger may be an input with its own key handlers, so the event keeps propagating
                break;
            case 'ArrowDown':
            case 'ArrowUp': {
                const edge = event.key === 'ArrowDown' ? 'first' : 'last';
                if (popVisible) {
                    if (this.#getMenuItemNodes(popup).length) {
                        this.#focusEdgeItem(popup, edge);
                    } else {
                        // content without menu items gets what Tooltip gives any popup: its first or last focusable
                        const focusable = FocusTrapHandle.getFocusableElements(popup);
                        (edge === 'first' ? focusable[0] : focusable.at(-1))?.focus();
                    }
                    handlePrevent(event);
                } else if (isMenuButton) {
                    // like Enter, this cannot open a custom or contextMenu trigger: the page owns when they open
                    const trigger = this.getProp('trigger');
                    if (!['click', 'hover', 'focus'].includes(trigger)) {
                        break;
                    }
                    handlePrevent(event);
                    this.#focusOnOpen = edge;
                    // a hover or focus trigger opens when it receives focus
                    if (target instanceof HTMLElement) {
                        if (trigger === 'click') {
                            target.click();
                        } else {
                            target.blur();
                            target.focus();
                        }
                    }
                }
                break;
            }
            case 'Tab':
                // APG: Tab closes the menu and moves focus as it normally would
                if (popVisible) {
                    this.close();
                    this.adapter.getContext('closeAll')?.();
                }
                break;
            default:
                break;
        }
    };
}
