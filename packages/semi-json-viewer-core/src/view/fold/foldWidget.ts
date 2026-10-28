import { elt, setStyles } from '../../common/dom';
import type { FoldingModel } from '../../model/foldingModel';
import type { View } from '../view';

export class FoldWidget {
    #view: View;
    #foldingModel: FoldingModel;
    #isMouseOver: boolean = false;

    constructor(view: View, foldingModel: FoldingModel) {
        this.#view = view;
        this.#foldingModel = foldingModel;
        this.#attachEventListeners();
    }

    #attachEventListeners() {
        this.#view.lineScrollDom.addEventListener('mouseover', (e) => {
            this.#handleLineNumberHover(e);
        });
        this.#view.lineScrollDom.addEventListener('mouseleave', () => {
            this.#handleLineNumberContainerLeave();
        });
    }

    #handleLineNumberHover(_e: MouseEvent) {
        this.#showFoldingIcon();
        this.#isMouseOver = true;
    }

    #handleLineNumberContainerLeave() {
        this.removeAllFoldingIcons();
        this.#isMouseOver = false;
    }

    #showFoldingIcon() {
        if (this.#isMouseOver) return;
        const lineNumberElement = this.#view.lineScrollDom.children;
        for (let i = 0; i < lineNumberElement.length; i++) {
            const element: HTMLElement = lineNumberElement[i] as HTMLElement;
            if (this.#foldingModel.isFoldable(Number(element.dataset.lineNumber))) {
                element.appendChild(this.#createFoldingIcon(Number(element.dataset.lineNumber)));
            }
        }
    }

    #createFoldSvg(isCollapsed: boolean): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', '1em');
        svg.setAttribute('height', '1em');
        if (isCollapsed) {
            svg.setAttribute('transform', 'rotate(270)');
        }
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = 'M21.8329 6.59139L12.8063 18.9004C12.4068 19.4452 11.5931 19.4452 11.1935 18.9004L2.16693 6.59139C1.68255 5.93086 2.15424 5.00003 2.97334 5.00003L21.0265 5.00003C21.8456 5.00003 22.3173 5.93087 21.8329 6.59139Z';
        path.setAttribute('d', d);
        path.setAttribute('fill', 'var(--semi-color-tertiary)');
        svg.appendChild(path);
        return svg;
    }

    #createFoldingIcon(lineNumber: number) {
        const foldingIconClass = `${this.#view.prefixCls}-folding-icon`;

        const foldingIcon = elt('span', foldingIconClass);
        const isCollapsed = this.#foldingModel.isCollapsed(lineNumber);
        foldingIcon.appendChild(this.#createFoldSvg(isCollapsed));
        setStyles(foldingIcon, {
            position: 'absolute',
            right: '0',
            top: '0',
            width: '40%',
            height: '100%',
            cursor: 'pointer',
            zIndex: '1',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        });

        foldingIcon.addEventListener('mousedown', (e) => {
            e.preventDefault(); // keep the click from changing the text selection
            e.stopPropagation();
            this.#foldingModel.toggleFoldingRange(lineNumber);
            this.#view.scalingCellSizeAndPositionManager.resetCell(0);
            this.#view.layout();
            this.#isMouseOver = false;
        });

        return foldingIcon;
    }

    removeAllFoldingIcons() {
        const foldingIconClass = `${this.#view.prefixCls}-folding-icon`;
        const foldingIcons = this.#view.lineScrollDom.querySelectorAll(`.${foldingIconClass}`);
        foldingIcons.forEach((icon) => icon.remove());
    }
}
