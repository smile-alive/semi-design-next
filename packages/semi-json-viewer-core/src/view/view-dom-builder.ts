import { elt, setStyles } from '../common/dom';
import type { JsonViewerOptions } from '../json-viewer/json-viewer';

export class ViewDOMBuilder {
    #lineHeight: number;
    #options?: JsonViewerOptions;
    #totalLines: number;
    prefixCls: string;

    constructor(lineHeight: number, totalLines: number, options?: JsonViewerOptions) {
        this.#lineHeight = lineHeight;
        this.#totalLines = totalLines;
        this.#options = options;
        this.prefixCls = options?.prefixCls || 'semi-json-viewer';
    }

    createRenderContainer() {
        const renderContainer = elt('div', 'json-viewer-container');
        setStyles(renderContainer, {
            position: 'relative',
            height: '100%',
            width: '100%',
            overflow: 'auto',
        });
        return renderContainer;
    }

    createLineNumberContainer() {
        const lineNumberClass = `${this.#options?.prefixCls}-line-number-container`;
        const lineNumberContainer = elt('div', lineNumberClass);
        setStyles(lineNumberContainer, {
            position: 'absolute',
            left: '0',
            top: '0',
            width: '50px',
        });
        return lineNumberContainer;
    }

    createContentContainer() {
        const contentClass = `${this.prefixCls}-content-container`;
        const contentContainer = elt('div', contentClass);
        setStyles(contentContainer, {
            position: 'absolute',
            left: '50px',
            top: '0',
            right: '0',
            overflowX: 'auto',
            overflowY: 'scroll',
        });

        if (this.#options?.readOnly) {
            // a focusable region, so the keyboard can scroll content that overflows
            contentContainer.tabIndex = 0;
            contentContainer.setAttribute('role', 'region');
        } else {
            contentContainer.contentEditable = 'true';
            contentContainer.style.caretColor = 'black';
            contentContainer.spellcheck = false;
            // the contenteditable has no implicit role; CodeMirror and Monaco expose their editors the same way
            contentContainer.setAttribute('role', 'textbox');
            contentContainer.setAttribute('aria-multiline', 'true');
        }
        if (this.#options?.ariaLabel) {
            contentContainer.setAttribute('aria-label', this.#options.ariaLabel);
        }
        return contentContainer;
    }

    createScrollElement() {
        const scrollEl = elt('div', 'lines-content');
        setStyles(scrollEl, {
            position: 'relative',
            overflow: 'hidden',
            top: '0',
            left: '0',
            tabSize: (this.#options?.formatOptions?.tabSize || 4).toString(),
            height: `${this.#lineHeight * this.#totalLines}px`,
        });

        if (this.#options?.autoWrap) {
            scrollEl.style.width = '100%';
        }
        return scrollEl;
    }

    createLineScrollContainer() {
        const lineScrollContainer = elt('div', 'line-scroll-container');
        setStyles(lineScrollContainer, {
            position: 'absolute',
            top: '0',
            left: '0',
            height: `${this.#lineHeight * this.#totalLines}px`,
            width: '100%',
            overflow: 'hidden',
        });
        return lineScrollContainer;
    }
}
