import { elt, setStyles } from '../../common/dom';
import { type Emitter, getEmitter } from '../../common/emitter';
import type { GlobalEvents, IModelContentChangeEvent } from '../../common/emitter-events';
import type { IPosition } from '../../common/position';
import type { JSONModel } from '../../model/json-model';
import { JSONCompletion } from '../../service/completion';
import { parseJsonAst } from '../../service/json-service';
import type { CompletionItem } from '../../service/json-types';
import type { View } from '../view';

export class CompleteWidget {
    #view: View;
    #jsonModel: JSONModel;
    #container: HTMLElement;
    #suggestionsContainer: HTMLElement;
    #selectedIndex: number = 0;
    #suggestions: CompletionItem[] = [];
    #emitter: Emitter<GlobalEvents> = getEmitter();
    isVisible: boolean = false;

    constructor(view: View, jsonModel: JSONModel) {
        this.#view = view;
        this.#jsonModel = jsonModel;

        this.#container = this.#createCompleteContainer();
        this.#suggestionsContainer = this.#createSuggestionsContainer();
        this.#container.appendChild(this.#suggestionsContainer);
        this.#view.jsonViewerDom.appendChild(this.#container);
        // APG combobox with a listbox popup: the editable content keeps focus and points at the active option.
        // aria-expanded is left out because the textbox role does not support it.
        if (!this.#view.options?.readOnly) {
            this.#view.contentDom.setAttribute('aria-autocomplete', 'list');
            this.#view.contentDom.setAttribute('aria-controls', this.#suggestionsContainer.id);
        }

        this.#attachEventListeners();
    }

    #attachEventListeners() {
        // Only a single typed non-whitespace character opens the popup; pastes and deletions do not.
        const shouldTrigger = (e: IModelContentChangeEvent) => {
            if (e.type !== 'insert') {
                return false;
            }
            if (e.newText.length !== 1) {
                return false;
            }
            if (/\s/.test(e.newText)) {
                return false;
            }
            return true;
        };

        this.#suggestionsContainer.addEventListener('click', (e) => {
            this.#handleSuggestionClick(e);
        });

        this.#emitter.on('contentChanged', (e) => {
            if (Array.isArray(e)) {
                return;
            }

            if (!shouldTrigger(e)) {
                this.hide();
                return;
            }

            this.#fetchCompletions();
        });
    }

    #fetchCompletions() {
        const root = parseJsonAst(this.#jsonModel);
        const position: IPosition = {
            lineNumber: this.#jsonModel.lastChangeBufferPos.lineNumber,
            column: this.#jsonModel.lastChangeBufferPos.column,
        };
        void new JSONCompletion(this.#view.options?.completionOptions || null).doCompletion(this.#jsonModel, position, root).then((completions) => {
            this.#suggestions = completions.items || [];
            this.show();
        });
    }

    #calculatePosition() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return { x: 0, y: 0 };

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const editorRect = this.#view.contentDom.getBoundingClientRect();

        const x = rect.left - editorRect.left + 50;
        const y = rect.bottom - editorRect.top;
        return { x, y };
    }

    #createCompleteContainer() {
        const className = `${this.#view.prefixCls}-complete-container`;
        const container = elt('div', className);
        setStyles(container, {
            display: 'none',
        });
        return container;
    }

    #createSuggestionsContainer() {
        const className = `${this.#view.prefixCls}-complete-suggestions-container`;
        const container = elt('ul', className);
        container.id = `${className}-${crypto.randomUUID()}`;
        container.setAttribute('role', 'listbox');
        setStyles(container, {
            maxHeight: '200px',
            overflowY: 'auto',
        });
        return container;
    }

    #handleSuggestionClick(e: MouseEvent) {
        e.preventDefault();
        if (e.target instanceof HTMLLIElement) {
            const index = Number(e.target.getAttribute('data-index'));
            if (!isNaN(index)) {
                this.#selectedIndex = index;
                this.complete();
            }
        }
    }

    #renderCompletions() {
        const className = `${this.#view.prefixCls}-complete-suggestions-item`;
        const fragment = document.createDocumentFragment();

        this.#suggestions.forEach((item, index) => {
            const selected = index === this.#selectedIndex;
            const suggestionItem = document.createElement('li');
            suggestionItem.className = className;
            suggestionItem.id = `${this.#suggestionsContainer.id}-${index}`;
            suggestionItem.setAttribute('role', 'option');
            suggestionItem.setAttribute('aria-selected', String(selected));
            suggestionItem.style.backgroundColor = selected ? 'var(--semi-color-fill-0)' : 'transparent';
            suggestionItem.dataset.index = index.toString();
            suggestionItem.textContent = item.label;
            fragment.appendChild(suggestionItem);
        });

        this.#suggestionsContainer.textContent = '';
        this.#suggestionsContainer.appendChild(fragment);
        this.#view.contentDom.setAttribute('aria-activedescendant', `${this.#suggestionsContainer.id}-${this.#selectedIndex}`);
    }

    show() {
        if (this.#suggestions.length === 0) {
            return;
        }
        const { x, y } = this.#calculatePosition();
        if (x < 0 || y < 0) {
            return;
        }
        this.isVisible = true;
        setStyles(this.#container, {
            left: `${x}px`,
            top: `${y}px`,
            display: 'block',
        });

        this.#suggestionsContainer.textContent = '';
        this.#renderCompletions();
    }

    handleKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.#selectedIndex = (this.#selectedIndex + 1) % this.#suggestions.length;
                this.#renderCompletions();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.#selectedIndex = (this.#selectedIndex - 1 + this.#suggestions.length) % this.#suggestions.length;
                this.#renderCompletions();
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.complete();
                break;
        }
    }

    complete() {
        const selectedItem = this.#suggestions[this.#selectedIndex];
        const { textEdit } = selectedItem;
        if (!textEdit) {
            return;
        }
        const { range } = textEdit;
        const startOffset = this.#jsonModel.getOffsetAt(range.startLineNumber, range.startColumn);

        const endOffset = this.#jsonModel.getOffsetAt(range.endLineNumber, range.endColumn);

        const op: IModelContentChangeEvent = {
            type: 'replace',
            range: {
                startLineNumber: range.startLineNumber,
                startColumn: range.startColumn,
                endLineNumber: range.endLineNumber,
                endColumn: range.endColumn,
            },
            rangeLength: endOffset - startOffset,
            rangeOffset: startOffset,
            oldText: this.#jsonModel.getValueInRange(range),
            newText: textEdit?.newText || '',
        };
        this.#jsonModel.applyOperation(op);
        this.hide();
    }

    hide() {
        if (!this.isVisible) return;
        this.isVisible = false;
        this.#container.style.display = 'none';
        this.#suggestions = [];
        this.#view.contentDom.removeAttribute('aria-activedescendant');
    }
}
