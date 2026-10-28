import { elt, setStyles } from '../../common/dom';
import { type Emitter, getEmitter } from '../../common/emitter';
import type { GlobalEvents } from '../../common/emitterEvents';
import { TOKEN_VALUE_STRING } from '../../tokens/tokenize';
import type { View } from '../view';
export class HoverWidget {
    #view: View;
    #hoverDom: HTMLElement | null = null;
    #tooltipDom: HTMLElement;
    #hoverTimer: number | null = null;
    #emitter: Emitter<GlobalEvents> = getEmitter();

    constructor(view: View) {
        this.#view = view;

        this.#tooltipDom = this.#createTooltipDom();
        this.#view.jsonViewerDom.appendChild(this.#tooltipDom);
        this.#attachEventListeners();
    }

    #attachEventListeners() {
        this.#view.contentDom.addEventListener('mousemove', (e) => {
            if (e.target instanceof HTMLSpanElement && e.target.classList.contains(`${this.#view.prefixCls}-${TOKEN_VALUE_STRING}`)) {
                if (this.#hoverDom === e.target) {
                    return;
                }
                this.#clearHoverTimer();
                this.#hideTooltip();

                this.#hoverDom = e.target;
                this.#hoverTimer = window.setTimeout(() => {
                    if (this.#hoverDom) {
                        this.#emitter.emit('hoverNode', {
                            value: this.#hoverDom.textContent ?? '',
                            target: this.#hoverDom,
                        });
                    }
                }, 700);
            }
        });

        this.#view.contentDom.addEventListener('mouseout', (e) => {
            const relatedTarget = e.relatedTarget as Node;
            if (!this.#tooltipDom.contains(relatedTarget)) {
                this.#clearHoverTimer();
                this.#hideTooltip();
            }
        });

        this.#tooltipDom.addEventListener('mouseleave', (e) => {
            const relatedTarget = e.relatedTarget as Node;
            if (!this.#hoverDom?.contains(relatedTarget)) {
                this.#hideTooltip();
            }
        });

        this.#emitter.on('renderHoverNode', (e) => {
            this.render(e.el);
        });
    }

    #clearHoverTimer() {
        if (this.#hoverTimer) {
            window.clearTimeout(this.#hoverTimer);
            this.#hoverTimer = null;
        }
    }

    #hideTooltip() {
        setStyles(this.#tooltipDom, {
            visibility: 'hidden',
        });
        this.#tooltipDom.textContent = '';
        this.#hoverDom = null;
    }

    #createTooltipDom() {
        const div = elt('div', 'hover-container');
        setStyles(div, {
            visibility: 'hidden',
            position: 'absolute',
            zIndex: '1000',
        });
        return div;
    }

    dispose() {
        this.#clearHoverTimer();
    }

    render(el: HTMLElement) {
        if (!this.#hoverDom) return;
        this.#tooltipDom.textContent = '';
        this.#tooltipDom.appendChild(el);

        const hoverRect = this.#hoverDom.getBoundingClientRect();
        const editorRect = this.#view.contentDom.getBoundingClientRect();
        const tooltipRect = this.#tooltipDom.getBoundingClientRect();

        let left = hoverRect.left - editorRect.left + (hoverRect.width + tooltipRect.width) / 2;
        left = Math.max(5, left);
        left = Math.min(left, editorRect.width - tooltipRect.width - 5);

        let top = hoverRect.top - editorRect.top - tooltipRect.height;

        if (hoverRect.top - tooltipRect.height - 5 < editorRect.top) {
            top = hoverRect.top - editorRect.top + hoverRect.height;
        }

        setStyles(this.#tooltipDom, {
            visibility: 'visible',
            top: `${top}px`,
            left: `${left}px`,
        });
    }
}
