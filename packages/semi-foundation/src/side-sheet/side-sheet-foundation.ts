import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { strings } from './constants';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface SideSheetProps {
    afterVisibleChange?: (isVisible: boolean) => void;
    bodyStyle?: Record<string, any>;
    className?: string;
    closable?: boolean;
    closeIcon?: any;
    closeOnEsc?: boolean;
    disableScroll?: boolean;
    footer?: any;
    getPopupContainer?: () => HTMLElement;
    headerStyle?: Record<string, any>;
    height?: number | string;
    keepDOM?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    maskStyle?: Record<string, any>;
    motion?: boolean;
    onCancel?: (e: any) => void;
    placement?: Placement;
    size?: 'small' | 'medium' | 'large';
    style?: Record<string, any>;
    title?: any;
    visible?: boolean;
    width?: number | string;
    zIndex?: number;
    children?: any;
    'aria-label'?: string;
}

export interface SideSheetState {}

/** Raw sizes, each set only when it applies; the host adds units and merges them over the caller's style */
export interface SheetSize {
    rootWidth?: number | string;
    dialogWidth?: number | string;
    dialogHeight: number | string;
}

export interface SideSheetAdapter<P extends SideSheetProps = SideSheetProps> extends DefaultAdapter<P, SideSheetState> {
    disabledBodyScroll: () => void;
    enabledBodyScroll: () => void;
    notifyCancel: (e: any) => void;
    notifyVisibleChange: (visible: boolean) => void;
    /** Puts the sheet on the overlay stack; `onEscape` receives Escape while it is on top */
    openLayer: (onEscape: (e: KeyboardEvent) => boolean) => void;
    closeLayer: () => void;
    /** Traps focus in the sheet; a no-op without mask, which is not modal */
    trapFocus: () => void;
    releaseFocus: () => void;
    restoreFocus: () => void;
    toggleDisplayNone: (displayNone: boolean) => void;
}

export default class SideSheetFoundation<P extends SideSheetProps = SideSheetProps> extends BaseFoundation<SideSheetAdapter<P>, P, SideSheetState> {
    // between beforeShow and afterHide: the layer, scroll lock and focus trap are held
    #shown = false;
    // destroyed while shown: init takes them again
    #resume = false;

    static override readonly propKeys = ['visible'];

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.handleCancel(e);
        return true;
    };

    /** Without a mask the width goes on the outer element and the dialog fills it: a percentage repeated on the dialog would compound. */
    static getSheetSize({ placement, canVerticalSetWidth, width, height, mask }: Pick<SideSheetProps, 'placement' | 'width' | 'height' | 'mask'> & { canVerticalSetWidth?: boolean }): SheetSize {
        const horizontal = placement === 'top' || placement === 'bottom';
        const sheetWidth = horizontal && !canVerticalSetWidth ? '100%' : width;
        const dialogHeight = horizontal ? height || strings.HEIGHT : '100%';
        if (!sheetWidth) {
            return { dialogHeight };
        }
        return mask ? { dialogWidth: sheetWidth, dialogHeight } : { rootWidth: sheetWidth, dialogWidth: '100%', dialogHeight };
    }

    static getInitialState(): SideSheetState {
        return {};
    }

    // A hidden instance (KeepAlive, StrictMode replay) holds nothing of the page and init takes it all again
    override init() {
        if (this.#resume) {
            this.#resume = false;
            this.beforeShow();
        }
    }

    override destroy() {
        if (this.#shown) {
            this.afterHide();
            this.#resume = true;
        }
    }

    // React refocuses the pre-commit element after the leave starts while the sheet is still mounted: restore again
    override handlePropsChange() {
        if (!this.getProp('visible')) {
            this.restoreFocus();
        }
    }

    handleCancel = (e: unknown) => {
        // the sheet stays mounted for its leave animation, and its mask and close button still take clicks
        if (!this.getProp('visible')) {
            return;
        }
        this.adapter.notifyCancel(e);
    };

    beforeShow = () => {
        if (this.#shown) {
            return;
        }
        this.#shown = true;
        const allowDisable = this.getProp('disableScroll');
        if (allowDisable) {
            this.adapter.disabledBodyScroll();
        }
        this.adapter.openLayer(this.#handleEscape);
        this.adapter.trapFocus();
    };

    // the layer closes before focus returns: it releases the page's inert, and an inert element cannot take focus
    afterHide = () => {
        this.#resume = false;
        if (!this.#shown) {
            return;
        }
        this.#shown = false;
        // unconditional: disableScroll may have changed since the lock was taken
        this.adapter.enabledBodyScroll();
        this.adapter.closeLayer();
        this.adapter.releaseFocus();
        this.restoreFocus();
    };

    restoreFocus = () => {
        this.adapter.restoreFocus();
    };

    onVisibleChange = (visible: boolean) => {
        this.adapter.notifyVisibleChange(visible);
    };

    toggleDisplayNone = (displayNone: boolean) => {
        this.adapter.toggleDisplayNone(displayNone);
    };
}
