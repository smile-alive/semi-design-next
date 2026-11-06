import { throttle, type ThrottledFunction } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { easeInOutCubic, tween } from '../utils/tween';
import warning, { isDev } from '../utils/warning';
import { strings } from './constants';

export type Target = Window | HTMLElement;

export interface BackTopBaseProps {
    // null: node not available yet, nothing is bound
    target?: () => Target | null;
    visibilityHeight?: number;
    duration?: number;
}

export interface BackTopState {
    visible: boolean;
}

export interface BackTopAdapter<P = BackTopBaseProps, E = unknown> extends DefaultAdapter<P, BackTopState> {
    notifyClick: (e: E) => void;
}

export default class BackTopFoundation<P extends BackTopBaseProps = BackTopBaseProps, E = unknown> extends BaseFoundation<BackTopAdapter<P, E>, P, BackTopState> {
    // a target change while hidden must wait for init, which binds the current target
    #active = false;
    #targetNode: Target = null;
    #frame: number;
    #cancelAnimation?: () => void;
    #throttledClick?: ThrottledFunction<(e: E) => void>;
    #throttleDuration?: number;

    static override readonly propKeys = ['target', 'duration'];

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
            if (visible !== this.getState('visible')) {
                this.setState({ visible });
            }
        });
    };

    #scrollToTop = (e: E) => {
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

    static getInitialState(): BackTopState {
        return { visible: false };
    }

    /** Children sit inside a native button, so interactive ones would nest; development only */
    static warnInteractiveChildren(button?: Element | null) {
        if (isDev()) {
            warning(Boolean(button?.querySelector(strings.INTERACTIVE_SELECTOR)), '[Semi BackTop] children are rendered inside a native button and must not contain interactive elements such as links, buttons, inputs or elements with tabindex or a widget role.');
        }
    }

    override init() {
        this.#active = true;
        this.#bind();
    }

    override handlePropsChange() {
        if (this.#active) {
            this.handleTargetChange();
        }
        // a click pending in the old window must not fire after the interval changed
        if (this.getProps().duration !== this.#throttleDuration) {
            this.#throttledClick?.cancel();
            this.#throttledClick = undefined;
        }
    }

    handleTargetChange = () => {
        if (this.getProps().target() !== this.#targetNode) {
            this.#unbind();
            this.#bind();
        }
    };

    override destroy() {
        this.#active = false;
        this.#unbind();
        this.#cancelAnimation?.();
        // a trailing click must not scroll or report after the component is gone
        this.#throttledClick?.cancel();
    }

    /** Throttled by `duration`: a click inside the window is merged into one trailing call, which also reaches `onClick` */
    onClick = (e: E) => {
        if (!this.#throttledClick) {
            this.#throttleDuration = this.getProps().duration;
            this.#throttledClick = throttle(this.#scrollToTop, this.#throttleDuration);
        }
        this.#throttledClick(e);
    };
}
