import { FocusTrapHandle, BaseFoundation, type DefaultAdapter, ModalResources, OverlaySession, PopupLifecycle } from '../../base/index';
import { coversPage, warnIfDialogUnnamed } from '../../utils/index';
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

/** What the sheet reads around it: ConfigProvider's popup container, which the sheet's own prop overrides */
export interface SideSheetContext {
    getPopupContainer?: () => HTMLElement;
}

export interface SideSheetAdapter<P extends SideSheetProps = SideSheetProps> extends DefaultAdapter<P, SideSheetState, SideSheetContext> {
    notifyCancel: (e: any) => void;
    notifyAfterVisibleChange: (isVisible: boolean) => void;
    /** The outermost element, which goes on the overlay stack */
    getRoot: () => HTMLElement | null | undefined;
    /** The `role="dialog"` element, which takes focus */
    getDialog: () => HTMLElement | null | undefined;
}

export default class SideSheetFoundation<P extends SideSheetProps = SideSheetProps> extends BaseFoundation<SideSheetAdapter<P>, P, SideSheetState> {
    // between beforeShow and afterHide: the layer, scroll lock and focus trap are held
    readonly #session = new OverlaySession();
    readonly #lifecycle = new PopupLifecycle();
    readonly #resources = new ModalResources();
    // not PopupLifecycle's open report: without motion React and Solid end the enter before handleHiddenChange(false)
    #shownReported = false;

    constructor(adapter: SideSheetAdapter<P>) {
        super(adapter);
        // a sheet mounted visible is shown without a report, and its unmount still reports afterVisibleChange(false)
        if (this.getProp('visible')) {
            this.#lifecycle.show();
            this.#shownReported = true;
        }
    }

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.handleCancel(e);
        return true;
    };

    #reportShown() {
        if (!this.#shownReported) {
            this.#shownReported = true;
            this.adapter.notifyAfterVisibleChange(true);
        }
    }

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

    /**
     * Only a mask over the whole page makes the sheet modal: aria-modal, the inert page, the Tab trap, unconditional
     * focus return and the body scroll lock. `inBody`: the sheet's container covers the page (`coversPage`).
     */
    static isModal({ mask, inBody }: { mask?: boolean; inBody: boolean }) {
        return Boolean(mask) && inBody;
    }

    static getInitialState(): SideSheetState {
        return {};
    }

    // A hidden instance (KeepAlive, StrictMode replay) holds nothing of the page and init takes it all again
    override init() {
        if (this.#session.resume()) {
            this.beforeShow();
        }
    }

    override destroy() {
        if (this.#session.suspend()) {
            this.#resources.release();
        }
    }

    /** Returns focus again, for a host whose framework refocuses the previously focused element after the close */
    restoreFocus = () => {
        this.#resources.restoreFocus();
    };

    /** Remembers the element to return focus to; hosts call it on opening, before anything inside the sheet takes focus */
    recordFocus = () => {
        this.#resources.record();
    };

    handleCancel = (e: unknown) => {
        // the sheet stays mounted for its leave animation, and its mask and close button still take clicks
        if (!this.getProp('visible')) {
            return;
        }
        this.adapter.notifyCancel(e);
    };

    /**
     * Hosts call this when the dialog's animation ends, and at once when a run without motion starts: the end of an
     * enter reports afterVisibleChange(true), once per showing.
     */
    handleAnimationEnd = () => {
        if (this.getProp('visible')) {
            this.#reportShown();
        }
    };

    /**
     * Hosts call this when the sheet stops or starts being hidden (once the animations ended), not on mount, and with
     * `true` when it unmounts for good: afterVisibleChange(false) is reported once per showing, after its `true`.
     */
    handleHiddenChange = (isHidden: boolean) => {
        if (isHidden) {
            this.#lifecycle.ended(() => {
                // closed before the enter ended
                this.#reportShown();
                this.#shownReported = false;
                this.adapter.notifyAfterVisibleChange(false);
            });
        } else {
            this.#lifecycle.show();
        }
    };

    beforeShow = () => {
        if (!this.#session.begin()) {
            return;
        }
        this.#lifecycle.show();
        const { mask, getPopupContainer, disableScroll } = this.getProps();
        const modal = SideSheetFoundation.isModal({ mask, inBody: coversPage(getPopupContainer ?? this.getContext('getPopupContainer')) });
        const dialog = this.adapter.getDialog();
        // no framework focuses an autofocus element of content inserted after load, so the sheet picks it before the
        // default (the dialog itself)
        if (dialog && !dialog.contains(FocusTrapHandle.getActiveElement(dialog))) {
            FocusTrapHandle.findAutofocus(dialog)?.focus({ preventScroll: true });
        }
        // shortcut: content under a mask confined to a custom container stays Tab-reachable, upgrade to inert on the
        // container's other children if it must become unreachable.
        this.#resources.hold({ modal, layer: this.adapter.getRoot(), onEscape: this.#handleEscape, lockScroll: disableScroll && modal, focus: dialog, preventScroll: true });
        warnIfDialogUnnamed(dialog ?? null, 'SideSheet');
    };

    // a user who moved on to the page next to a non-modal sheet keeps that focus
    afterHide = () => {
        if (this.#session.end()) {
            this.#resources.release();
        }
    };
}
