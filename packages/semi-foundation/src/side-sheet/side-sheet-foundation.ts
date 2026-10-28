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

export interface SideSheetAdapter<P extends SideSheetProps = SideSheetProps, S extends SideSheetState = SideSheetState> extends DefaultAdapter<P, S> {
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
    /** Focuses the element focused before the sheet opened */
    restoreFocus: () => void;
    toggleDisplayNone: (displayNone: boolean) => void;
}

// the component pairs beforeShow with afterHide, even on unmount, so destroy() stays the base no-op
export default class SideSheetFoundation<P extends SideSheetProps = SideSheetProps, S extends SideSheetState = SideSheetState> extends BaseFoundation<SideSheetAdapter<P, S>, P, S> {
    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.handleCancel(e);
        return true;
    };

    /**
     * A top or bottom sheet spans the width unless `canVerticalSetWidth`, and takes `height` (448 by default); a left or
     * right sheet spans the height. Without a mask the width goes on the outer element and the dialog fills it: a
     * percentage repeated on the dialog would compound.
     */
    static getSheetSize({ placement, canVerticalSetWidth, width, height, mask }: Pick<SideSheetProps, 'placement' | 'width' | 'height' | 'mask'> & { canVerticalSetWidth?: boolean }): SheetSize {
        const horizontal = placement === 'top' || placement === 'bottom';
        const sheetWidth = horizontal && !canVerticalSetWidth ? '100%' : width;
        const dialogHeight = horizontal ? height || strings.HEIGHT : '100%';
        if (!sheetWidth) {
            return { dialogHeight };
        }
        return mask ? { dialogWidth: sheetWidth, dialogHeight } : { rootWidth: sheetWidth, dialogWidth: '100%', dialogHeight };
    }

    handleCancel(e: any) {
        // the sheet stays mounted for its leave animation, and its mask and close button still take clicks
        if (!this.getProp('visible')) {
            return;
        }
        this._adapter.notifyCancel(e);
    }

    beforeShow() {
        const allowDisable = this.getProp('disableScroll');
        if (allowDisable) {
            this._adapter.disabledBodyScroll();
        }
        this._adapter.openLayer(this.#handleEscape);
        this._adapter.trapFocus();
    }

    // the layer closes before focus returns: it releases the page's inert, and an inert element cannot take focus
    afterHide() {
        // unconditional: disableScroll may have changed since the lock was taken
        this._adapter.enabledBodyScroll();
        this._adapter.closeLayer();
        this._adapter.releaseFocus();
        this.restoreFocus();
    }

    restoreFocus() {
        this._adapter.restoreFocus();
    }

    onVisibleChange(visible: boolean) {
        this._adapter.notifyVisibleChange(visible);
    }

    toggleDisplayNone(displayNone: boolean) {
        this._adapter.toggleDisplayNone(displayNone);
    }
}
