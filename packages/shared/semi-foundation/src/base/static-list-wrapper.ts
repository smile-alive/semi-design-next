import { defaultPopupContainer } from '../utils/dom';
import { KEEP_INTERACTIVE_ATTRIBUTE } from '../utils/layer';
import { createId } from '../utils/uuid';

/**
 * The container element a static API (Toast, Notification) mounts its list into. It is held as an element, not found by
 * id: two instances created in the same millisecond would share an id. `mount` is the host's: it renders the list into
 * the element and returns what unmounts it.
 */
export default class StaticListWrapper {
    readonly #className: string;
    readonly #idPrefix: string | undefined;
    #element: HTMLDivElement | null = null;
    #unmount: (() => void) | null = null;

    constructor(className: string, idPrefix?: string) {
        this.#className = className;
        this.#idPrefix = idPrefix;
    }

    get element() {
        return this.#element;
    }

    get id() {
        return this.#element?.id || null;
    }

    /**
     * Creates and mounts the wrapper on the first call; the list then reads what was added to its store before it
     * mounted. Without `getContainer` every call moves the wrapper into the current fullscreen element or back to body:
     * nothing outside the fullscreen element is shown. Known limitation: the move restarts the CSS animations of the
     * toasts already shown and drops focus inside the list; it happens only on the first add after fullscreen starts or ends.
     */
    ensure(getContainer: (() => HTMLElement) | undefined, mount: (wrapper: HTMLDivElement) => () => void) {
        if (this.#element) {
            const container = getContainer ? null : defaultPopupContainer();
            if (container && this.#element.parentNode !== container) {
                container.appendChild(this.#element);
            }
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = this.#className;
            if (this.#idPrefix) {
                wrapper.id = createId(this.#idPrefix);
            }
            // a modal layer must not make the live region inert
            wrapper.setAttribute(KEEP_INTERACTIVE_ATTRIBUTE, '');
            (getContainer?.() ?? defaultPopupContainer()).appendChild(wrapper);
            this.#element = wrapper;
            this.#unmount = mount(wrapper);
        }
        return this.#element;
    }

    /** Unmounts and removes the wrapper; false when there was none */
    destroy() {
        if (!this.#element) {
            return false;
        }
        this.#unmount?.();
        this.#element.remove();
        this.#element = null;
        this.#unmount = null;
        return true;
    }
}
