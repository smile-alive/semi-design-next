import { clamp } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { isSecondaryPress } from '../utils/pointer';

export interface DragMoveAdapter<P extends DragMoveBaseProps = DragMoveBaseProps, S extends object = object> extends DefaultAdapter<P, S> {
    notifyMouseDown: (e: PointerEvent) => void;
    notifyMouseMove: (e: PointerEvent) => void;
    notifyMouseUp: (e: PointerEvent) => void;
    notifyTouchStart: (e: PointerEvent) => void;
    notifyTouchMove: (e: PointerEvent) => void;
    notifyTouchEnd: (e: PointerEvent) => void;
    notifyTouchCancel: (e: PointerEvent) => void;
}

/** The props the foundation reads with getProp */
export interface DragMoveBaseProps {
    handler?: () => HTMLElement | null;
    constrainer?: 'parent' | (() => HTMLElement | null);
    positionStrategy?: 'absolute' | 'relative';
    allowInputDrag?: boolean;
    allowMove?: (e: PointerEvent, element: HTMLElement) => boolean;
    customMove?: (element: HTMLElement, top: number, left: number) => void;
}

export default class DragMoveFoundation<P extends DragMoveBaseProps = DragMoveBaseProps, S extends object = object> extends BaseFoundation<DragMoveAdapter<P, S>, P, S> {
    // the dragged element is only known when a pointer goes down on it (its Fragment child), so it is read lazily
    #element: HTMLElement;
    readonly #elements = new Set<HTMLElement>();
    #handlerObserver: MutationObserver | null = null;
    #dragController: AbortController | null = null;
    #pointerId: number;
    #xMax: number;
    #xMin: number;
    #yMax: number;
    #yMin: number;
    #startOffsetX: number;
    #startOffsetY: number;
    #startClientX: number;
    #startClientY: number;
    #startLeft: number;
    #startTop: number;

    #getConstrainer(element: HTMLElement): HTMLElement | null {
        const constrainer = this.getProp('constrainer');
        if (constrainer === 'parent') {
            return element.parentNode as HTMLElement;
        }
        return typeof constrainer === 'function' ? constrainer() : null;
    }

    #getHandler(element: HTMLElement) {
        return this.getProp('handler')?.() ?? element;
    }

    #calcMoveRange() {
        const constrainer = this.#getConstrainer(this.#element);
        if (constrainer) {
            if (this.getProp('positionStrategy') === 'relative') {
                const elementRect = this.#element.getBoundingClientRect();
                const constrainerRect = constrainer.getBoundingClientRect();
                const style = window.getComputedStyle(this.#element);
                const currentLeft = parseFloat(style.left) || 0;
                const currentTop = parseFloat(style.top) || 0;
                this.#xMin = currentLeft + constrainerRect.left - elementRect.left;
                this.#xMax = currentLeft + constrainerRect.right - elementRect.right;
                this.#yMin = currentTop + constrainerRect.top - elementRect.top;
                this.#yMax = currentTop + constrainerRect.bottom - elementRect.bottom;
                return;
            }
            let node = this.#element.offsetParent as HTMLElement;
            let startX = 0;
            let startY = 0;
            while (node !== constrainer && node !== null) {
                startX -= node.offsetLeft;
                startY -= node.offsetTop;
                node = node.offsetParent as HTMLElement;
            }
            this.#xMin = startX;
            this.#xMax = startX + constrainer.offsetWidth - this.#element.offsetWidth;
            this.#yMin = startY;
            this.#yMax = startY + constrainer.offsetHeight - this.#element.offsetHeight;
        }
    }

    #allowMove(e: PointerEvent) {
        const { allowMove, allowInputDrag } = this.getProps();
        if (!allowInputDrag) {
            const target = (e.target as HTMLElement).tagName.toLowerCase();
            if (target === 'input' || target === 'textarea') {
                return false;
            }
        }
        if (allowMove) {
            return allowMove(e, this.#element);
        }
        return true;
    }

    #calcOffset(e: PointerEvent) {
        if (this.getProp('positionStrategy') === 'relative') {
            const style = window.getComputedStyle(this.#element);
            this.#startClientX = e.clientX;
            this.#startClientY = e.clientY;
            this.#startLeft = parseFloat(style.left) || 0;
            this.#startTop = parseFloat(style.top) || 0;
            return;
        }
        this.#startOffsetX = e.clientX - this.#element.offsetLeft;
        this.#startOffsetY = e.clientY - this.#element.offsetTop;
    }

    #changePos(e: PointerEvent) {
        const { customMove } = this.getProps();
        const element = this.#element;
        const useRelativePosition = this.getProp('positionStrategy') === 'relative';
        let newLeft = useRelativePosition ? this.#startLeft + e.clientX - this.#startClientX : e.clientX - this.#startOffsetX;
        let newTop = useRelativePosition ? this.#startTop + e.clientY - this.#startClientY : e.clientY - this.#startOffsetY;
        if (this.#getConstrainer(element)) {
            newLeft = clamp(newLeft, this.#xMin, this.#xMax);
            newTop = clamp(newTop, this.#yMin, this.#yMax);
        }

        requestAnimationFrame(() => {
            if (customMove) {
                customMove(element, newTop, newLeft);
                return;
            }
            element.style.top = newTop + 'px';
            element.style.left = newLeft + 'px';
        });
    }

    #isTouch(e: PointerEvent) {
        return e.pointerType === 'touch';
    }

    #onPointerMove = (e: PointerEvent) => {
        if (e.pointerId !== this.#pointerId) {
            return;
        }
        if (this.#isTouch(e)) {
            this._adapter.notifyTouchMove(e);
        } else {
            this._adapter.notifyMouseMove(e);
        }
        this.#changePos(e);
    };

    #onPointerEnd = (e: PointerEvent) => {
        if (e.pointerId !== this.#pointerId) {
            return;
        }
        this.#stopDrag();
        if (e.type === 'pointercancel') {
            this._adapter.notifyTouchCancel(e);
        } else if (this.#isTouch(e)) {
            this._adapter.notifyTouchEnd(e);
        } else {
            this._adapter.notifyMouseUp(e);
        }
    };

    #stopDrag() {
        this.#dragController?.abort();
        this.#dragController = null;
    }

    #applyPositionStrategy(element: HTMLElement) {
        element.style.position = this.getProp('positionStrategy') === 'relative' ? 'relative' : 'absolute';
    }

    #prepareHandlers() {
        for (const element of this.#elements) {
            const handler = this.#getHandler(element);
            handler.style.cursor = 'move';
            handler.style.touchAction = 'none';
        }
    }

    /** Bound on each host child of the DragMove, so `currentTarget` is the element to drag. */
    handlePointerDown = (event: Event) => {
        // FragmentInstance.addEventListener types its listener as EventListener
        const e = event as PointerEvent;
        // a second finger or button while one pointer drags is not a new drag
        if (this.#dragController) {
            return;
        }
        // only the primary button drags: a right or middle press opens a context menu or autoscroll, whose pointerup
        // never reaches the document
        if (isSecondaryPress(e)) {
            return;
        }
        const element = e.currentTarget as HTMLElement;
        const handler = this.#getHandler(element);
        if (!handler.contains(e.target as Node)) {
            return;
        }
        this.#element = element;
        this.#calcMoveRange();
        if (this.#isTouch(e)) {
            this._adapter.notifyTouchStart(e);
        } else {
            this._adapter.notifyMouseDown(e);
        }
        if (!this.#allowMove(e)) {
            return;
        }
        // No setPointerCapture: the browser would retarget the click to the dragged element, so a button inside it
        // (JsonViewer's search trigger) would never see its click. The document listeners below already follow the
        // pointer, and a touch pointer is implicitly captured by its target anyway.
        this.#pointerId = e.pointerId;
        const controller = new AbortController();
        this.#dragController = controller;
        const { signal } = controller;
        document.addEventListener('pointermove', this.#onPointerMove, { signal });
        document.addEventListener('pointerup', this.#onPointerEnd, { signal });
        document.addEventListener('pointercancel', this.#onPointerEnd, { signal });
        // a native image drag would cancel the pointer, and a text selection would follow the drag
        for (const type of ['selectstart', 'dragstart']) {
            document.addEventListener(type, (event) => event.preventDefault(), { signal });
        }
        this.#calcOffset(e);
    };

    /**
     * Prepares host children as they appear: the position strategy, a move cursor on the handler, and
     * `touch-action: none` so a touch drag is not taken over by scrolling.
     */
    prepareElements(elements: Element[]) {
        for (const element of this.#elements) {
            if (!element.isConnected) {
                this.#elements.delete(element);
            }
        }
        for (const element of elements as HTMLElement[]) {
            if (this.#elements.has(element)) {
                continue;
            }
            this.#elements.add(element);
            this.#applyPositionStrategy(element);
            // a swapped handler does not resize the child, so ResizeObserver would not report it
            this.#handlerObserver ??= new MutationObserver(() => this.#prepareHandlers());
            this.#handlerObserver.observe(element, { childList: true, subtree: true });
        }
        this.#prepareHandlers();
    }

    updatePositionStrategy() {
        for (const element of this.#elements) {
            this.#applyPositionStrategy(element);
        }
    }

    override destroy() {
        this.#stopDrag();
        this.#handlerObserver?.disconnect();
        this.#handlerObserver = null;
        // a StrictMode remount reports the children again and must observe them again
        this.#elements.clear();
    }
}
