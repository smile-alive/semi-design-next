import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { easeInOutCubic, tween } from '../utils/tween';
import warning, { isDev } from '../utils/warning';
import { strings } from './constants';

/** What `target()` returns: the window or a scrollable element */
export type Target = Window | HTMLElement;

/** The props the foundation reads */
export interface BackTopBaseProps {
    // null: node not available yet, nothing is bound
    target?: () => Target | null;
    visibilityHeight?: number;
    duration?: number;
}

export interface BackTopBaseState {
    visible?: boolean;
}

export interface BackTopAdapter<P = BackTopBaseProps, S = BackTopBaseState, E = unknown> extends DefaultAdapter<P, S> {
    updateVisible: (visible: boolean) => void;
    notifyClick: (e: E) => void;
}

export default class BackTopFoundation<P extends BackTopBaseProps = BackTopBaseProps, S extends BackTopBaseState = BackTopBaseState, E = unknown> extends BaseFoundation<BackTopAdapter<P, S, E>, P, S> {
    #targetNode: Target = null;
    #frame: number;
    #cancelAnimation?: () => void;

    #bind() {
        const targetNode = this.getProps().target();
        if (!targetNode) {
            return;
        }
        this.#targetNode = targetNode;
        targetNode.addEventListener('scroll', this.#handleScroll);
        this.#handleScroll();
    }

    #unbind() {
        this.#targetNode?.removeEventListener('scroll', this.#handleScroll);
        this.#targetNode = null;
        cancelAnimationFrame(this.#frame);
    }

    #getScroll(target: Target) {
        return 'scrollY' in target ? target.scrollY : target.scrollTop;
    }

    #handleScroll = () => {
        cancelAnimationFrame(this.#frame);
        this.#frame = requestAnimationFrame(() => {
            const { visibilityHeight } = this.getProps();
            const visible = this.#getScroll(this.#targetNode) > visibilityHeight;
            // every adapter write re-renders; scroll events outnumber visibility changes
            if (visible !== Boolean(this.getStates().visible)) {
                this.adapter.updateVisible(visible);
            }
        });
    };

    /** Children sit inside a native button, so interactive ones would nest; development only */
    static warnInteractiveChildren(button?: Element | null) {
        if (isDev()) {
            warning(Boolean(button?.querySelector(strings.INTERACTIVE_SELECTOR)), '[Semi BackTop] children are rendered inside a native button and must not contain interactive elements such as links, buttons, inputs or elements with tabindex or a widget role.');
        }
    }

    override init() {
        this.#bind();
    }

    /** Rebinds the scroll listener when `target` returns a different element */
    handleTargetChange = () => {
        if (this.getProps().target() !== this.#targetNode) {
            this.#unbind();
            this.#bind();
        }
    };

    override destroy() {
        this.#unbind();
        this.#cancelAnimation?.();
    }

    onClick = (e: E) => {
        const targetNode = this.#targetNode;
        if (targetNode) {
            this.#cancelAnimation?.();
            this.#cancelAnimation = tween({
                from: this.#getScroll(targetNode),
                to: 0,
                duration: this.getProps().duration,
                easing: easeInOutCubic,
                onFrame: (scrollTop) => {
                    // the window scrolls through the root element
                    const scroller = 'document' in targetNode ? document.documentElement : targetNode;
                    scroller.scrollTop = scrollTop;
                },
            });
        }
        this.adapter.notifyClick(e);
    };
}
