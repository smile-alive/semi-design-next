import { elt, setStyles } from '../common/dom';
import { type Emitter, getEmitter } from '../common/emitter';
import type { GlobalEvents } from '../common/emitter-events';
import type { FindMatch } from '../common/model';
import type { CustomRenderRule, JsonViewerOptions, TokenRenderType } from '../json-viewer/json-viewer';
import { FoldingModel } from '../model/folding-model';
import type { JSONModel } from '../model/json-model';
import { SelectionModel } from '../model/selection-model';
import type { ASTNode } from '../service/json-types';
import { type JsonDocument, getNodePath, getPathChain, getNodeValue, parseJson } from '../service/parse';
import { TokenizationJsonModelPart } from '../tokens/tokenization-json-model-part';
import { type Token, TOKEN_PROPERTY_NAME, TOKEN_VALUE_BOOLEAN, TOKEN_VALUE_NULL, TOKEN_VALUE_NUMBER, TOKEN_VALUE_STRING } from '../tokens/tokenize';
import { CompleteWidget } from './complete/complete-widget';
import { EditWidget } from './edit/edit-widget';
import { ErrorWidget } from './error/error-widget';
import { FoldWidget } from './fold/fold-widget';
import { HoverWidget } from './hover/hover-widget';
import { SearchWidget } from './search/search-widget';
import { ViewDOMBuilder } from './view-dom-builder';
import { ScalingCellSizeAndPositionManager } from './virtualized/scaling-cell-size-and-position-manager';

export class View {
    #jsonModel: JSONModel;
    #selectionModel: SelectionModel;
    #foldingModel: FoldingModel;

    #options: JsonViewerOptions | undefined;

    #root: JsonDocument | null = null;
    #customRenderMap: Map<HTMLElement, any> = new Map();
    #customRenderEmittedEmpty = true;

    #container: HTMLElement;
    #jsonViewerDom: HTMLElement;
    #lineNumberDom: HTMLElement;
    #lineScrollDom: HTMLElement;
    #contentDom: HTMLElement;
    #scrollDom: HTMLElement;
    #domBuilder: ViewDOMBuilder;

    #verticalOffsetAdjustment: number = 0;

    #searchWidget: SearchWidget;
    #editWidget: EditWidget;
    #completeWidget: CompleteWidget;
    #hoverWidget: HoverWidget;
    #errorWidget: ErrorWidget;
    #tokenizationJsonModelPart: TokenizationJsonModelPart;
    #scalingCellSizeAndPositionManager: ScalingCellSizeAndPositionManager;
    #customRenderRule: CustomRenderRule[];
    #measuredHeights: { [index: number]: number } = {};

    #emitter: Emitter<GlobalEvents> = getEmitter();
    #lineHeight: number;

    startLineNumber: number = 1;
    visibleLineCount: number = 0;
    prefixCls: string;

    constructor(container: HTMLElement, model: JSONModel, options?: JsonViewerOptions) {
        this.#container = container;
        this.#jsonModel = model;
        this.#selectionModel = new SelectionModel(1, 0, this, model);
        this.#foldingModel = new FoldingModel(model);

        this.#lineHeight = options?.lineHeight || 20;
        this.#options = options;
        this.#customRenderRule = options?.customRenderRule || null;
        this.prefixCls = options?.prefixCls || 'semi-json-viewer';

        this.#domBuilder = new ViewDOMBuilder(this.#lineHeight, model.getLineCount(), options);

        this.#jsonViewerDom = this.#domBuilder.createRenderContainer();
        this.#lineNumberDom = this.#domBuilder.createLineNumberContainer();
        this.#contentDom = this.#domBuilder.createContentContainer();
        this.#scrollDom = this.#domBuilder.createScrollElement();
        this.#lineScrollDom = this.#domBuilder.createLineScrollContainer();

        this.#contentDom.appendChild(this.#scrollDom);
        this.#lineNumberDom.appendChild(this.#lineScrollDom);
        this.#jsonViewerDom.appendChild(this.#lineNumberDom);
        this.#jsonViewerDom.appendChild(this.#contentDom);
        this.#container.appendChild(this.#jsonViewerDom);

        this.#searchWidget = new SearchWidget(this, this.#jsonModel);
        // The fold widget lives through the listeners it registers; nothing calls it afterwards
        new FoldWidget(this, this.#foldingModel);
        this.#editWidget = new EditWidget(this, this.#jsonModel, this.#selectionModel);
        this.#completeWidget = new CompleteWidget(this, this.#jsonModel);
        this.#hoverWidget = new HoverWidget(this);
        this.#errorWidget = new ErrorWidget(this);

        this.#tokenizationJsonModelPart = new TokenizationJsonModelPart(this.#jsonModel);

        this.#scalingCellSizeAndPositionManager = new ScalingCellSizeAndPositionManager({
            cellCount: this.#jsonModel.getLineCount(),
            cellSizeGetter: ({ index }) => this.#getCellSize(index),
            estimatedCellSize: this.#lineHeight,
        });

        this.#attachEventListeners();
    }

    #attachEventListeners() {
        if (this.#options?.readOnly && this.#options.customRenderRule) {
            const { root } = parseJson(this.#jsonModel);
            this.#root = root;
        }

        this.#jsonViewerDom.addEventListener('scroll', () => {
            this.onScroll(this.#jsonViewerDom.scrollTop);
        });
        if (this.#options?.readOnly) return;
        this.#jsonViewerDom.addEventListener('click', (e) => {
            e.preventDefault();
            this.#selectionModel.toLastPosition();
        });

        this.#contentDom.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.#completeWidget.hide();
            this.#selectionModel.isSelectedAll = false;
            this.#selectionModel.isSelecting = false;
            this.#selectionModel.updateFromSelection();
        });

        this.#emitter.on('contentChanged', () => {
            this.resetScalingManagerConfigAndCell(0);
            this.resetMeasuredHeights();
            if (this.#jsonModel.lastChangeBufferPos.lineNumber >= this.visibleLineCount + this.startLineNumber) {
                this.scrollToLine(this.#jsonModel.lastChangeBufferPos.lineNumber - this.visibleLineCount + 1);
                return;
            }
            this.layout();
        });
        this.#emitter.on('forceRender', () => {
            this.resetScalingManagerConfigAndCell(0);
            this.layout();
            this.#errorWidget.renderErrorLine();
        });
    }

    #createLineNumberElement(actualLineNumber: number, visibleLineNumber: number) {
        const lineNumberClass = `${this.prefixCls}-line-number`;
        const lineNumberElement = elt('div', lineNumberClass);
        const rowDatum = this.#scalingCellSizeAndPositionManager.getSizeAndPositionOfCell(visibleLineNumber);
        setStyles(lineNumberElement, {
            position: 'absolute',
            width: '50px',
            height: `${this.#lineHeight}px`,
            lineHeight: `${this.#lineHeight}px`,
            top: `${rowDatum.offset + this.#verticalOffsetAdjustment}px`,
        });
        const lineNumber = elt('span', 'line-number-text', {
            position: 'absolute',
            left: '0',
            top: '0',
            textAlign: 'right',
            width: '60%',
            height: '100%',
        });
        lineNumber.textContent = actualLineNumber.toString();
        lineNumberElement.appendChild(lineNumber);
        lineNumberElement.dataset.lineNumber = actualLineNumber.toString();
        return lineNumberElement;
    }

    #createLineContentElement(actualLineNumber: number, visibleLineNumber: number) {
        const lineElementClass = `${this.prefixCls}-view-line`;
        const lineElement = elt('div', lineElementClass);
        lineElement.setAttribute('data-line-element', 'true');

        const rowDatum = this.#scalingCellSizeAndPositionManager.getSizeAndPositionOfCell(visibleLineNumber);
        setStyles(lineElement, {
            lineHeight: `${this.#lineHeight}px`,
            width: '100%',
            position: 'absolute',
            top: `${rowDatum.offset + this.#verticalOffsetAdjustment}px`,
        });

        if (!this.#options?.autoWrap) {
            lineElement.style.height = `${this.#lineHeight}px`;
        }

        lineElement.dataset.lineNumber = actualLineNumber.toString();
        // @ts-ignore
        lineElement.lineNumber = actualLineNumber;
        return lineElement;
    }

    #getCellSize(index: number) {
        if (this.#options?.autoWrap) {
            return this.#measuredHeights[index] || this.#lineHeight;
        }
        return this.#lineHeight;
    }

    #measureAndUpdateItemHeight(item: HTMLElement, index: number) {
        const height = item.offsetHeight;
        const width = item.children[0].getBoundingClientRect().width * 2;

        if (!this.#options?.autoWrap && width > this.#scrollDom.offsetWidth) {
            this.#scrollDom.style.width = `${width}px`;
        }
        if (height === 0) {
            item.style.height = `${this.#lineHeight}px`;
            return;
        }
        if (height !== this.#measuredHeights[index]) {
            this.#measuredHeights[index] = height;
            this.#scalingCellSizeAndPositionManager.resetCell(index);
            this.#scalingCellSizeAndPositionManager.getSizeAndPositionOfCell(index);
            this.#scrollDom.style.height = `${this.#scalingCellSizeAndPositionManager.getTotalSize()}px`;
        }
    }

    #clearContainers() {
        this.#lineScrollDom.textContent = '';
        this.#scrollDom.textContent = '';
    }

    #renderVisibleLines(startVisibleLine: number, endVisibleLine: number) {
        this.#tokenizationJsonModelPart.forceTokenize(endVisibleLine + 1);
        let actualLineNumber = this.#foldingModel.getActualLineNumber(startVisibleLine + 1);
        let visibleLineNumber = startVisibleLine;
        while (visibleLineNumber <= endVisibleLine && actualLineNumber <= this.#jsonModel.getLineCount()) {
            if (!this.#foldingModel.isLineCollapsed(actualLineNumber)) {
                this.#renderLine(actualLineNumber, visibleLineNumber);
                visibleLineNumber++;
            }
            actualLineNumber = this.#foldingModel.getNextVisibleLine(actualLineNumber);
        }
    }

    #renderLine(actualLineNumber: number, visibleLineNumber: number) {
        const line = this.#jsonModel.getLineContent(actualLineNumber);

        const tokens = this.#tokenizationJsonModelPart.getLineTokens(actualLineNumber);

        this.#renderLineNumber(actualLineNumber, visibleLineNumber);
        this.#renderLineContent(actualLineNumber, visibleLineNumber, tokens, line);
    }

    #renderLineNumber(actualLineNumber: number, visibleLineNumber: number) {
        const lineNumberElement = this.#createLineNumberElement(actualLineNumber, visibleLineNumber);
        this.#lineScrollDom.appendChild(lineNumberElement);
        return lineNumberElement;
    }

    #renderLineContent(actualLineNumber: number, visibleLineNumber: number, tokens: Token[], line: string) {
        const lineElement = this.#createLineContentElement(actualLineNumber, visibleLineNumber);
        const contentContainer = this.#renderTokensWithHighlight(tokens, line, actualLineNumber);
        lineElement.appendChild(contentContainer);
        this.#scrollDom.appendChild(lineElement);

        this.#measureAndUpdateItemHeight(lineElement, visibleLineNumber);
        return lineElement;
    }

    #renderTokensWithHighlight(tokens: Token[], text: string, lineNumber: number): HTMLElement {
        const container = document.createElement('span');
        let currentOffset = 0;

        const searchResults = this.#searchWidget.binarySearchByLine(lineNumber);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const start = token.startIndex;
            const end = i + 1 < tokens.length ? tokens[i + 1].startIndex : text.length;
            let content = text.substring(start, end);

            if (searchResults && searchResults.length > 0) {
                const highlightedSpan = this.#createHighlightedContent(content, currentOffset, searchResults, token.scopes);
                container.appendChild(highlightedSpan);
            } else {
                if (this.#options?.readOnly && this.#tryApplyCustomRender(token.scopes, content)) {
                    // Token start, not a middle position: that may hit whitespace or ':' and resolve to a 'property'
                    // node with an empty path.
                    const offset = this.#jsonModel.getOffsetAt(lineNumber, start + 1);
                    const node = this.#root?.getNodeFromOffset(offset);
                    const path = node ? getNodePath(node) : [];
                    const pathChain = getPathChain(path);
                    const customElement = this.#renderCustomToken(content, this.#customRenderRule, token, pathChain, node);
                    // null, undefined and false keep the token text: `cond && <X />` yields false
                    if (customElement instanceof HTMLElement) {
                        container.appendChild(customElement);
                        continue;
                    } else if (customElement != null && customElement !== false) {
                        const span = document.createElement('span');
                        span.className = `${this.prefixCls}-${token.scopes}`;
                        span.textContent = content;
                        container.appendChild(span);
                        this.#customRenderMap.set(span, customElement);
                        continue;
                    }
                }

                const span = document.createElement('span');
                span.className = `${this.prefixCls}-${token.scopes}`;
                span.textContent = content;
                if (!this.#options?.autoWrap) {
                    span.style.whiteSpace = 'pre';
                }
                container.appendChild(span);
            }

            currentOffset += content.length;
        }

        return container;
    }

    #createHighlightedContent(content: string, offset: number, searchResults: FindMatch[], tokenClass: string): HTMLElement {
        const container = document.createElement('span');
        let lastIndex = 0;

        for (const match of searchResults) {
            const startIndex = Math.max(0, match.range.startColumn - 1 - offset);
            const endIndex = Math.min(content.length, match.range.endColumn - 1 - offset);

            if (startIndex >= content.length || endIndex <= 0) continue;

            if (startIndex > lastIndex) {
                const normalSpan = document.createElement('span');
                normalSpan.className = `${this.prefixCls}-${tokenClass}`;
                normalSpan.textContent = content.substring(lastIndex, startIndex);
                container.appendChild(normalSpan);
            }

            const highlightSpan = document.createElement('span');
            highlightSpan.textContent = content.substring(startIndex, endIndex);

            const currentMatch = this.#searchWidget.searchResults?.[this.#searchWidget.currentResultIndex];
            const isCurrentMatch = match.range.startLineNumber === currentMatch?.range.startLineNumber && match.range.endLineNumber === currentMatch?.range.endLineNumber && match.range.startColumn === currentMatch?.range.startColumn && match.range.endColumn === currentMatch?.range.endColumn;

            highlightSpan.className = `${this.prefixCls}-${tokenClass} ${this.prefixCls}-search-result${isCurrentMatch ? ` ${this.prefixCls}-current-search-result` : ''}`;
            highlightSpan.dataset.startColumn = match.range.startColumn.toString();
            highlightSpan.dataset.endColumn = match.range.endColumn.toString();

            container.appendChild(highlightSpan);
            lastIndex = endIndex;
        }

        if (lastIndex < content.length) {
            const remainingSpan = document.createElement('span');
            remainingSpan.className = `${this.prefixCls}-${tokenClass}`;
            remainingSpan.textContent = content.substring(lastIndex);
            container.appendChild(remainingSpan);
        }

        return container;
    }

    #tryApplyCustomRender(tokenClass: string, _content: string) {
        if (!this.#customRenderRule || this.#customRenderRule.length <= 0) return false;
        if (tokenClass === TOKEN_VALUE_BOOLEAN || tokenClass === TOKEN_VALUE_NULL || tokenClass === TOKEN_VALUE_STRING || tokenClass === TOKEN_VALUE_NUMBER || tokenClass === TOKEN_PROPERTY_NAME) {
            return true;
        }
        return false;
    }

    #isMatch(content: string, typedValue: string | number | boolean | null, pathChain: string, tokenType: TokenRenderType, rule: CustomRenderRule) {
        const match = rule.match;
        if (typeof match === 'function') {
            return match(typedValue, pathChain, tokenType);
        } else if (typeof match === 'string') {
            return match === content;
        } else if (match instanceof RegExp) {
            return match.test(content);
        }
        return false;
    }

    #renderCustomToken(content: string, rule: CustomRenderRule[], token: Token, pathChain: string, node: ASTNode): unknown {
        const realContent = content.replace(/^"|"$/g, '');

        const tokenType: TokenRenderType = token.scopes === TOKEN_PROPERTY_NAME ? 'key' : 'value';

        // number/boolean/null come from the AST; strings and property names are already realContent
        let typedValue: string | number | boolean | null = realContent;
        if (token.scopes === TOKEN_VALUE_NUMBER || token.scopes === TOKEN_VALUE_BOOLEAN || token.scopes === TOKEN_VALUE_NULL) {
            if (node) {
                typedValue = getNodeValue(node);
            }
        }

        for (const item of rule) {
            if (this.#isMatch(realContent, typedValue, pathChain, tokenType, item)) {
                const element = item.render(content);
                return element;
            }
        }
        return null;
    }

    get tokenizationJsonModelPart() {
        return this.#tokenizationJsonModelPart;
    }

    get contentDom() {
        return this.#contentDom;
    }

    get jsonViewerDom() {
        return this.#jsonViewerDom;
    }

    get scrollDom() {
        return this.#scrollDom;
    }

    get lineScrollDom() {
        return this.#lineScrollDom;
    }

    get options() {
        return this.#options;
    }

    get completeWidget() {
        return this.#completeWidget;
    }

    get editWidget() {
        return this.#editWidget;
    }

    get scalingCellSizeAndPositionManager() {
        return this.#scalingCellSizeAndPositionManager;
    }

    get searchWidget() {
        return this.#searchWidget;
    }

    dispose() {
        this.#hoverWidget?.dispose();
        this.#container.removeChild(this.#jsonViewerDom);
    }

    getLineElement(lineNumber: number): HTMLElement | null {
        return this.scrollDom.querySelector(`[data-line-number="${lineNumber}"]`);
    }

    updateVisibleRange(start: number, end: number) {
        this.startLineNumber = start;
        this.visibleLineCount = end - start + 1;
    }

    onScroll(scrollTop: number) {
        this.#jsonViewerDom.scrollTop = scrollTop;
        this.layout();
        this.#errorWidget.renderErrorLine();
    }

    scrollToLine(lineNumber: number) {
        const scrollTop = (lineNumber - 1) * this.#lineHeight;
        this.#contentDom.scrollTop = scrollTop;
        this.onScroll(scrollTop);
    }

    resetScalingManagerConfigAndCell(index: number) {
        this.#scalingCellSizeAndPositionManager.configure({
            cellCount: this.#jsonModel.getLineCount(),
            cellSizeGetter: ({ index }) => this.#getCellSize(index),
            estimatedCellSize: this.#lineHeight,
        });
        this.#scalingCellSizeAndPositionManager.resetCell(index);
    }

    resetMeasuredHeights() {
        this.#measuredHeights = {};
    }

    layout() {
        this.#clearContainers();
        this.#customRenderMap.clear();

        const visibleLineCount = this.#foldingModel.getVisibleLineCount();
        this.#scalingCellSizeAndPositionManager.configure({
            cellCount: visibleLineCount,
            cellSizeGetter: ({ index }) => this.#getCellSize(index),
            estimatedCellSize: this.#lineHeight,
        });

        const visibleRange = this.#scalingCellSizeAndPositionManager.getVisibleCellRange({
            containerSize: this.#container.clientHeight,
            offset: this.#jsonViewerDom.scrollTop,
        });

        const verticalOffsetAdjustment = this.#scalingCellSizeAndPositionManager.getOffsetAdjustment({
            containerSize: this.#container.clientHeight,
            offset: this.#jsonViewerDom.scrollTop,
        });
        this.#verticalOffsetAdjustment = verticalOffsetAdjustment;
        this.#renderVisibleLines(visibleRange.start, visibleRange.stop);
        this.updateVisibleRange(visibleRange.start + 1, visibleRange.stop + 1);

        if (!this.#options?.readOnly) {
            this.#selectionModel.toViewPosition();
            this.#completeWidget.show();
        }
        const totalSize = this.#scalingCellSizeAndPositionManager.getTotalSize();
        this.#scrollDom.style.height = `${totalSize}px`;
        this.#lineScrollDom.style.height = `${totalSize}px`;
        if (this.#options?.readOnly && this.#customRenderRule?.length) {
            const empty = this.#customRenderMap.size === 0;
            // Only the first empty map after a filled one is emitted, so the host drops its removed spans without
            // re-rendering on every scroll frame; the host starts out empty
            if (!empty || !this.#customRenderEmittedEmpty) {
                this.#customRenderMap.forEach((_value, key) => {
                    key.textContent = '';
                });
                this.#emitter.emit('customRender', {
                    customRenderMap: this.#customRenderMap,
                });
            }
            this.#customRenderEmittedEmpty = empty;
        }
    }
}
