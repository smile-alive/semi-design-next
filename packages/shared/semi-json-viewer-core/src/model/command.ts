import type { IModelContentChangeEvent } from '../common/emitter-events';
import type { JSONModel } from './json-model';

export interface Command {
    execute(): void;
    undo(): void;
    readonly operation: IModelContentChangeEvent | IModelContentChangeEvent[];
    readonly oldPos: { lineNumber: number; column: number };
    readonly newPos: { lineNumber: number; column: number };
}

export abstract class BaseCommand implements Command {
    protected model: JSONModel;
    readonly oldPos: { lineNumber: number; column: number };
    readonly newPos: { lineNumber: number; column: number };
    readonly operation: IModelContentChangeEvent;

    constructor(model: JSONModel, operation: IModelContentChangeEvent) {
        this.model = model;
        this.operation = operation;
        this.oldPos = { ...model.lastChangeBufferPos };
        this.model.updateLastChangeBufferPos(operation);
        this.newPos = { ...model.lastChangeBufferPos };
    }

    protected updateBufferPos(isUndo: boolean) {
        this.model.lastChangeBufferPos = {
            ...(isUndo ? this.oldPos : this.newPos),
        };
    }

    abstract execute(): void;
    abstract undo(): void;
}

export class InsertCommand extends BaseCommand {
    execute() {
        this.model.pieceTree.insert(this.operation.rangeOffset, this.operation.newText);
        this.updateBufferPos(false);
    }

    undo() {
        this.model.pieceTree.delete(this.operation.rangeOffset, this.operation.newText.length);
        this.updateBufferPos(true);
    }
}

export class DeleteCommand extends BaseCommand {
    execute() {
        this.model.pieceTree.delete(this.operation.rangeOffset, this.operation.rangeLength);
        this.updateBufferPos(false);
    }

    undo() {
        this.model.pieceTree.insert(this.operation.rangeOffset, this.operation.oldText);
        this.updateBufferPos(true);
    }
}

export class ReplaceCommand extends BaseCommand {
    execute() {
        this.model.pieceTree.delete(this.operation.rangeOffset, this.operation.oldText.length);
        this.model.pieceTree.insert(this.operation.rangeOffset, this.operation.newText);
        this.updateBufferPos(false);
    }

    undo() {
        this.model.pieceTree.delete(this.operation.rangeOffset, this.operation.newText.length);
        this.model.pieceTree.insert(this.operation.rangeOffset, this.operation.oldText);
        this.updateBufferPos(true);
    }
}

export class MultiCommand implements Command {
    #model: JSONModel;
    readonly oldPos: { lineNumber: number; column: number };
    readonly newPos: { lineNumber: number; column: number };
    readonly operation: IModelContentChangeEvent[];

    constructor(model: JSONModel, operation: IModelContentChangeEvent[]) {
        this.#model = model;
        this.operation = operation;
        this.oldPos = { ...model.lastChangeBufferPos };
        this.newPos = { ...model.lastChangeBufferPos };
    }

    execute() {
        for (let i = 0; i < this.operation.length; i++) {
            const op = this.operation[i];
            switch (op.type) {
                case 'insert':
                    this.#model.pieceTree.insert(op.rangeOffset, op.newText);
                    break;
                case 'delete':
                    this.#model.pieceTree.delete(op.rangeOffset, op.rangeLength);
                    break;
                case 'replace':
                    this.#model.pieceTree.delete(op.rangeOffset, op.oldText.length);
                    this.#model.pieceTree.insert(op.rangeOffset, op.newText);
                    break;
            }
        }
        this.#model.lastChangeBufferPos = { ...this.newPos };
    }

    undo() {
        for (let i = this.operation.length - 1; i >= 0; i--) {
            const op = this.operation[i];
            if (op.newText && op.oldText) {
                this.#model.pieceTree.delete(op.rangeOffset, op.newText.length);
                this.#model.pieceTree.insert(op.rangeOffset, op.oldText);
            } else if (op.newText) {
                this.#model.pieceTree.delete(op.rangeOffset, op.newText.length);
            } else {
                this.#model.pieceTree.insert(op.rangeOffset, op.oldText);
            }
        }
        this.#model.lastChangeBufferPos = { ...this.oldPos };
    }
}
