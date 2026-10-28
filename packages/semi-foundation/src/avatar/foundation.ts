import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

/** The props the foundation reads */
export interface AvatarBaseProps {
    gap?: number;
}

export interface AvatarBaseState {}

/** E is the host's mouse event, which the foundation only passes through */
export interface AvatarAdapter<P = AvatarBaseProps, S = AvatarBaseState, E = unknown> extends DefaultAdapter<P, S> {
    setImgExist(isImgExist: boolean): void;
    notifyLeave(event: E): void;
    /** Returns what the callback returned: `false` keeps the broken image instead of falling back */
    notifyError(): boolean | void;
    notifyEnter(event: E): void;
    setScale: (scale: number) => void;
    /** Widths of the avatar and of its text content; null while no text is rendered */
    getTextWidths: () => { container: number; text: number } | null;
}

export default class AvatarFoundation<P extends AvatarBaseProps = AvatarBaseProps, S extends AvatarBaseState = AvatarBaseState, E = unknown> extends BaseFoundation<AvatarAdapter<P, S, E>, P, S> {
    override init() {
        this.changeScale();
    }

    override destroy() {}

    handleSrcChange() {
        this._adapter.setImgExist(true);
    }

    handleImgLoadError() {
        const errorFlag = this._adapter.notifyError();
        if (errorFlag !== false) {
            this._adapter.setImgExist(false);
        }
    }

    handleEnter(e: E) {
        this._adapter.notifyEnter(e);
    }

    handleLeave(e: E) {
        this._adapter.notifyLeave(e);
    }

    changeScale() {
        const { gap } = this.getProps();
        const widths = this._adapter.getTextWidths();
        if (!widths) {
            return;
        }
        const { container: nodeWidth, text: stringNodeWidth } = widths;
        if (nodeWidth !== 0 && stringNodeWidth !== 0 && gap * 2 < nodeWidth) {
            const scale = nodeWidth - gap * 2 > stringNodeWidth ? 1 : (nodeWidth - gap * 2) / stringNodeWidth;
            this._adapter.setScale(scale);
        }
    }
}
