import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { cssClasses } from './constants';

export interface CollapsibleFoundationProps {
    isOpen?: boolean;
    duration?: number;
    motion?: boolean;
    keepDOM?: boolean;
    lazyRender?: boolean;
    className?: string;
    collapseHeight?: number;
    collapseHeightAdaptive?: boolean;
    id?: string;
    fade?: boolean;
}

/** The props the foundation reads; the host fills their defaults before passing props in */
export type CollapsibleBaseProps = Required<Pick<CollapsibleFoundationProps, 'isOpen' | 'duration' | 'motion' | 'keepDOM' | 'lazyRender' | 'collapseHeight' | 'collapseHeightAdaptive' | 'fade'>>;

/** Render state derived from isOpen during render, so the height change and the transition land in one commit */
export interface CollapsibleView {
    isOpen: boolean;
    visible: boolean;
    isTransitioning: boolean;
    rendered: boolean;
}

export interface CollapsibleAdapter<P extends CollapsibleBaseProps = CollapsibleBaseProps> extends DefaultAdapter<P, object> {
    setVisible: (visible: boolean) => void;
    setIsTransitioning: (isTransitioning: boolean) => void;
    notifyMotionEnd: () => void;
    /** The wrapper element whose height animates; its first child is the content */
    getWrapper: () => HTMLElement | null;
}

// the entry of a comma-separated transition longhand that goes with `property`; commas inside cubic-bezier() stay
function transitionEntry(style: CSSStyleDeclaration, longhand: 'transitionTimingFunction' | 'transitionDelay', property: string) {
    const index = Math.max(style.transitionProperty.split(/,\s*/).indexOf(property), 0);
    const entries = style[longhand].split(/,(?![^(]*\))\s*/);
    return entries[index % entries.length];
}

export default class CollapsibleFoundation<P extends CollapsibleBaseProps = CollapsibleBaseProps> extends BaseFoundation<CollapsibleAdapter<P>, P, object> {
    #heightAnimation: Animation | null = null;

    static getInitialView(props: Pick<CollapsibleBaseProps, 'isOpen'>): CollapsibleView {
        return { isOpen: props.isOpen, visible: props.isOpen, isTransitioning: false, rendered: false };
    }

    /** Returns `view` itself when nothing changes, so the host can compare by identity before writing */
    static deriveView(props: CollapsibleBaseProps, view: CollapsibleView) {
        const { isOpen } = props;
        const animated = CollapsibleFoundation.hasMotion(props);
        let next = view;
        if (isOpen !== next.isOpen) {
            next = {
                ...next,
                isOpen,
                // closing with motion keeps the content visible until the transition ends
                visible: isOpen || !animated ? isOpen : next.visible,
                isTransitioning: animated ? true : next.isTransitioning,
            };
        }
        if (!next.rendered && CollapsibleFoundation.shouldRender(props, next)) {
            next = { ...next, rendered: true };
        }
        return next;
    }

    static shouldRender({ keepDOM, lazyRender, collapseHeight, isOpen }: CollapsibleBaseProps, view: CollapsibleView) {
        return (keepDOM && (lazyRender ? view.rendered : true)) || collapseHeight !== 0 || view.visible || isOpen;
    }

    /** A zero duration starts no transition, so no transitionend would ever end the motion */
    static hasMotion({ motion, duration }: Pick<CollapsibleBaseProps, 'motion' | 'duration'>) {
        return motion && duration > 0;
    }

    static isInTransition(props: Pick<CollapsibleBaseProps, 'motion' | 'duration'>, view: CollapsibleView) {
        return CollapsibleFoundation.hasMotion(props) && view.isTransitioning;
    }

    // calc-size() clamps the preview to the content's own size, so it never exceeds shorter content
    static getCollapsedHeight({ collapseHeight, collapseHeightAdaptive }: Pick<CollapsibleBaseProps, 'collapseHeight' | 'collapseHeightAdaptive'>) {
        return collapseHeightAdaptive ? `calc-size(auto, min(size, ${collapseHeight}px))` : `${collapseHeight}px`;
    }

    /**
     * Heights go through custom properties because an inline `height` would beat the stylesheet's `@starting-style`
     * rule, which supplies the side being left when the browser never computed it (toggle in the mount's task, or
     * under `display: none`). The open height is `calc-size(auto, size)`, not `auto`, so it interpolates with a
     * length without an inherited `interpolate-size`.
     */
    static getWrapperStyle(props: CollapsibleBaseProps, view: CollapsibleView) {
        const { isOpen, fade, collapseHeight, duration } = props;
        const openHeight = 'calc-size(auto, size)';
        const collapsedHeight = CollapsibleFoundation.getCollapsedHeight(props);
        return {
            overflow: 'hidden',
            [`--${cssClasses.PREFIX}-height`]: isOpen ? openHeight : collapsedHeight,
            [`--${cssClasses.PREFIX}-from-height`]: isOpen ? collapsedHeight : openHeight,
            // read only without calc-size(), where the adaptive preview falls back to auto (collapsible.scss)
            [`--${cssClasses.PREFIX}-max-height`]: !isOpen && props.collapseHeightAdaptive ? `${collapseHeight}px` : undefined,
            opacity: isOpen || !fade || collapseHeight !== 0 ? 1 : 0,
            transitionDuration: `${CollapsibleFoundation.isInTransition(props, view) ? duration : 0}ms`,
        } as const;
    }

    override destroy() {
        this.#heightAnimation?.cancel();
        this.#heightAnimation = null;
    }

    /**
     * Hosts call this after committing an `isOpen` change. Without calc-size() (Firefox, Safari) the open height is
     * `auto`, which a transition cannot interpolate, so no transition runs and no transitionend ends the motion; the
     * height animates between measured lengths instead and its end stands in for the transitionend. Removable, with
     * the max-height rule of collapsible.scss, once Firefox and Safari support calc-size().
     */
    handleOpenChange = () => {
        const { isOpen, duration, collapseHeight, collapseHeightAdaptive } = this.getProps();
        const wrapper = this._adapter.getWrapper();
        if (!wrapper || !CollapsibleFoundation.hasMotion(this.getProps()) || CSS.supports('height', 'calc-size(auto, size)')) {
            return;
        }
        // reversing midway starts from the height on screen
        const current = this.#heightAnimation && this.#heightAnimation.playState !== 'finished' ? wrapper.offsetHeight : undefined;
        this.#heightAnimation?.cancel();
        const contentHeight = (wrapper.firstElementChild as HTMLElement).offsetHeight;
        const collapsed = collapseHeightAdaptive ? Math.min(contentHeight, collapseHeight) : collapseHeight;
        const from = current ?? (isOpen ? collapsed : contentHeight);
        const to = isOpen ? contentHeight : collapsed;
        const style = getComputedStyle(wrapper);
        const delay = transitionEntry(style, 'transitionDelay', 'height');
        // max-height: none, or the adaptive preview's cap would hold the collapse at its end height throughout
        const animation = wrapper.animate(
            [
                { height: `${from}px`, maxHeight: 'none' },
                { height: `${to}px`, maxHeight: 'none' },
            ],
            {
                duration,
                delay: parseFloat(delay) * (delay.endsWith('ms') ? 1 : 1000),
                easing: transitionEntry(style, 'transitionTimingFunction', 'height'),
            }
        );
        this.#heightAnimation = animation;
        animation.finished.then(
            () => {
                // a reversal can come between the end and this callback
                if (this.#heightAnimation === animation) {
                    this.#heightAnimation = null;
                    this.handleTransitionEnd({ isSelf: true, propertyName: 'height' });
                }
            },
            // cancelled by a reversal or unmount, which take over
            () => undefined
        );
    };

    /**
     * `isSelf`: the event comes from the wrapper, not bubbling from the content. Only `height` is awaited: toggling
     * `isOpen` always transitions it, even when `fade` also animates `opacity`.
     */
    handleTransitionEnd = ({ isSelf, propertyName }: { isSelf: boolean; propertyName: string }) => {
        if (!isSelf || propertyName !== 'height') {
            return;
        }
        if (!this.getProp('isOpen')) {
            this._adapter.setVisible(false);
        }
        this._adapter.setIsTransitioning(false);
        this._adapter.notifyMotionEnd();
    };
}
