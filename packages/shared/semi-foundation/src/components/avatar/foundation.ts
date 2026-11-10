import BaseFoundation, { type DefaultAdapter } from '../../base/foundation';

export interface AvatarBaseProps {
    gap?: number;
    src?: string;
    /** The size after the host resolved it from AvatarGroup and the global defaults */
    size?: string;
}

export interface AvatarState {
    isImgExist: boolean;
    hovered: boolean;
    scale: number;
}

/** E is the host's mouse event and ErrorEvent the host's image error event; the foundation only passes them through */
export interface AvatarAdapter<P = AvatarBaseProps, E = unknown, ErrorEvent = unknown> extends DefaultAdapter<P, AvatarState> {
    notifyLeave(event: E): void;
    /** Returns what the callback returned: `false` keeps the broken image instead of falling back */
    notifyError(event: ErrorEvent): boolean | void;
    notifyEnter(event: E): void;
    /** The avatar element, whose width bounds the text */
    getAvatarElement: () => HTMLElement | null;
    /** The element that holds the text and is scaled to fit; null while no text is rendered */
    getTextElement: () => HTMLElement | null;
}

export default class AvatarFoundation<P extends AvatarBaseProps = AvatarBaseProps, E = unknown, ErrorEvent = unknown> extends BaseFoundation<AvatarAdapter<P, E, ErrorEvent>, P, AvatarState> {
    static override readonly propKeys = ['src', 'gap', 'size'];

    static getInitialState(): AvatarState {
        return { isImgExist: true, hovered: false, scale: 1 };
    }

    override init() {
        this.changeScale();
    }

    override handlePropsChange(prev: Partial<P>) {
        if (prev.src !== this.getProp('src')) {
            this.setState({ isImgExist: true });
        }
        if (prev.gap !== this.getProp('gap') || prev.size !== this.getProp('size')) {
            this.changeScale();
        }
    }

    handleImgLoadError = (e: ErrorEvent) => {
        const errorFlag = this.adapter.notifyError(e);
        if (errorFlag !== false) {
            this.setState({ isImgExist: false });
        }
    };

    handleEnter = (e: E) => {
        this.setState({ hovered: true });
        this.adapter.notifyEnter(e);
    };

    handleLeave = (e: E) => {
        this.setState({ hovered: false });
        this.adapter.notifyLeave(e);
    };

    changeScale = () => {
        const { gap } = this.getProps();
        const avatar = this.adapter.getAvatarElement();
        const text = this.adapter.getTextElement();
        if (!avatar || !text) {
            return;
        }
        const nodeWidth = avatar.offsetWidth;
        const stringNodeWidth = text.offsetWidth;
        if (nodeWidth !== 0 && stringNodeWidth !== 0 && gap * 2 < nodeWidth) {
            const scale = nodeWidth - gap * 2 > stringNodeWidth ? 1 : (nodeWidth - gap * 2) / stringNodeWidth;
            this.setState({ scale });
        }
    };
}
