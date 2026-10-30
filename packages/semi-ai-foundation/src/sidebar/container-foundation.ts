import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';

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
    /** Puts the sidebar on the overlay stack (utils/layer) as a non-modal layer that receives Escape while on top */
    openLayer: (onEscape: (e: KeyboardEvent) => boolean) => void;
    closeLayer: () => void;
    toggleDisplayNone: (displayNone: boolean) => void;
    /** Focuses the element focused when the sidebar opened, unless the user has moved focus elsewhere on the page */
    restoreFocus: () => void;
}

export default class ContainerFoundation extends BaseFoundation<ContainerAdapter, ContainerProps, Record<string, never>> {
    #handleCancel(e: KeyboardEvent) {
        this._adapter.notifyCancel(e);
    }

    #handleEscape = (e: KeyboardEvent) => {
        if (!this.getProp('closeOnEsc')) {
            return false;
        }
        this.#handleCancel(e);
        return true;
    };

    #toggleDisplayNone(displayNone: boolean) {
        this._adapter.toggleDisplayNone(displayNone);
    }

    override init() {}

    beforeShow = () => {
        this._adapter.openLayer(this.#handleEscape);
    };

    closeLayer = () => {
        this._adapter.closeLayer();
    };

    // focused content unmounts with the sidebar, which would leave focus on the body
    afterHide = () => {
        this.closeLayer();
        this.restoreFocus();
    };

    restoreFocus = () => {
        this._adapter.restoreFocus();
    };

    onVisibleChange = (visible: boolean) => {
        this._adapter.notifyVisibleChange(visible);
    };

    handleAnimationEnd = () => {
        const { visible } = this.getProps();
        this.#toggleDisplayNone(!visible);
    };
}
