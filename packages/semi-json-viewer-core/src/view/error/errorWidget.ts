import { type Emitter, getEmitter } from '../../common/emitter';
import type { GlobalEvents } from '../../common/emitterEvents';
import type { Diagnostic } from '../../service/jsonTypes';
import type { View } from '../view';

export class ErrorWidget {
    #view: View;
    #emitter: Emitter<GlobalEvents> = getEmitter();
    #problems: Diagnostic[] = [];

    constructor(view: View) {
        this.#view = view;
        this.#attachEventListeners();
    }

    #attachEventListeners() {
        this.#emitter.on('problemsChanged', (result: any) => {
            this.#problems = result.problems;
            this.renderErrorLine();
        });
    }

    #findDomByPos(start: { lineNumber: number; column: number }, end: { lineNumber: number; column: number }, _errMessage: string) {
        let line = this.#view.getLineElement(start.lineNumber);
        line = line?.children[0] as HTMLElement;
        if (!line) return;
        let offset = 1;
        for (let i = 0; i < line.children.length; i++) {
            const child = line.children[i];
            offset += child.textContent?.length || 0;
            if (offset > start.column && offset <= end.column) {
                const className = `${this.#view.prefixCls}-error`;
                child.classList.add(className);
            }
        }
    }

    renderErrorLine() {
        if (this.#problems.length === 0) return;
        this.#problems.forEach((problem: Diagnostic) => {
            const { start, end } = problem.range;
            const errMessage = problem.message;
            this.#findDomByPos(start, end, errMessage);
        });
    }
}
