import { BaseFoundation, type DefaultAdapter, ModalResources } from '@fibrae/semi-foundation/base';

export interface ContainerProps {
    title?: any;
    resizable?: boolean;
    style?: Record<string, any>;
    className?: string;
    defaultSize?: { width?: number | string; height?: number | string };
    onCancel?: (e: any) => void;
    children?: any;
    visible?: boolean;
    motion?: boolean;
    afterVisibleChange?: (isVisible: boolean) => void;
    minWidth?: string | number;
    maxWidth?: string | number;
    showClose?: boolean;
    /** Whether pressing Esc calls `onCancel`; off by default */
    closeOnEsc?: boolean;
}

export interface ContainerAdapter extends DefaultAdapter<ContainerProps, Record<string, never>> {
    notifyCancel: (e: KeyboardEvent) => void;
    notifyVisibleChange: (visible: boolean) => void;
    /** The `.semi-sidebar-container` element; null while it is not rendered */
    getRoot: () => HTMLElement | null;
    /**
     * The sidebar's outermost element: the Resizable around the container when there is one, else the container.
     * The Resizable's drag handles are siblings of the container, and a modal layer opened earlier would make them inert.
     */
    getLayer: () => HTMLElement | null;
    toggleDisplayNone: (displayNone: boolean) => void;
}

export default class ContainerFoundation extends BaseFoundation<ContainerAdapter, ContainerProps, Record<string, never>> {
    readonly #resources = new ModalResources();
    static override readonly propKeys = ['visible'];

    #handleCancel(e: KeyboardEvent) {
        this.adapter.notifyCancel(e);
    }

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.#handleCancel(e);
        return true;
    };

    #toggleDisplayNone(displayNone: boolean) {
        this.adapter.toggleDisplayNone(displayNone);
    }

    // afterHide is not enough: a container hidden in the tick it mounted never ran beforeShow, yet focus may already be
    // inside it, and a host may refocus the pre-commit element after the layer cleanup while the content is still
    // mounted for the leave animation
    override handlePropsChange() {
        if (!this.getProp('visible')) {
            this.restoreFocus();
        }
    }

    /** Remembers the element to return focus to; hosts call it on showing, before anything inside the sidebar takes focus */
    recordFocus = () => {
        this.#resources.record();
    };

    // The page beside the sidebar stays usable, so the layer is not modal and focus does not move in
    beforeShow = () => {
        this.#resources.hold({ modal: false, layer: this.adapter.getLayer(), onEscape: this.#handleEscape, preventScroll: true });
    };

    closeLayer = () => {
        this.#resources.release();
    };

    // focused content unmounts with the sidebar, which would leave focus on the body
    afterHide = () => {
        this.closeLayer();
        this.restoreFocus();
    };

    /** Skipped when the user has moved focus elsewhere on the page */
    restoreFocus = () => {
        this.#resources.restoreFocus(this.adapter.getRoot());
    };

    onVisibleChange = (visible: boolean) => {
        this.adapter.notifyVisibleChange(visible);
    };

    handleAnimationEnd = () => {
        const { visible } = this.getProps();
        this.#toggleDisplayNone(!visible);
    };
}
