import type { FormattingOptions } from 'jsonc-parser';
import type { IModelContentChangeEvent } from '../common/emitter-events';
import { createModel } from '../model';
import type { JSONModel } from '../model/json-model';
import { formatJson, getFoldingRanges, doValidate, parseJsonAst } from '../service/json-service';

export class JsonWorker {
    #model: JSONModel | null = null;

    constructor(value: string) {
        this.#model = createModel(value);
    }

    getModel() {
        return this.#model;
    }

    format(options: FormattingOptions) {
        if (!this.#model) throw new Error('Model not initialized');
        return formatJson(this.#model, options);
    }

    foldRange() {
        if (!this.#model) throw new Error('Model not initialized');
        return getFoldingRanges(this.#model);
    }

    validate() {
        if (!this.#model) throw new Error('Model not initialized');
        return doValidate(this.#model);
    }

    updateModel(op: IModelContentChangeEvent | IModelContentChangeEvent[]) {
        this.#model?.applyOperation(op);
        return op;
    }

    undo() {
        this.#model?.undo();
    }

    redo() {
        this.#model?.redo();
    }

    parse() {
        if (!this.#model) throw new Error('Model not initialized');
        return parseJsonAst(this.#model);
    }
}
