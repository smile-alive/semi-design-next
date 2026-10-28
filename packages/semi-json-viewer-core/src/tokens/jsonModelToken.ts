import { runWhenGlobalIdle } from '../common/async';
import { StopWatch } from '../common/stopWatch';
/** reference from https://github.com/microsoft/vscode */
import type { JSONModel } from '../model/jsonModel';
import { OffsetRange } from './offsetRange';
import type { IBackgroundTokenizationStore } from './tokenizationJsonModelPart';
import type { JSONState, JsonTokenizationSupport } from './tokenize';

export class TokenizerWithStateStore {
    readonly #initialState: JSONState;
    readonly store: TrackingTokenizationStateStore;
    readonly tokenizationSupport: JsonTokenizationSupport;
    constructor(lineCount: number, tokenizationSupport: JsonTokenizationSupport) {
        this.tokenizationSupport = tokenizationSupport;
        this.#initialState = tokenizationSupport.getInitialState();
        this.store = new TrackingTokenizationStateStore(lineCount);
    }

    getStartState(lineNumber: number) {
        return this.store.getStartState(lineNumber, this.#initialState);
    }

    getFirstInvalidLine(): {
        lineNumber: number;
        startState: JSONState;
    } | null {
        return this.store.getFirstInvalidLine(this.#initialState);
    }
}

export class JsonTokenizerWithStateStoreAndModel extends TokenizerWithStateStore {
    readonly jsonModel: JSONModel;
    constructor(lineCount: number, tokenizationSupport: JsonTokenizationSupport, jsonModel: JSONModel) {
        super(lineCount, tokenizationSupport);
        this.jsonModel = jsonModel;
    }

    updateTokensUntilLine(lineNumber: number, backgroundTokenizationStore: IBackgroundTokenizationStore) {
        while (true) {
            const lineToTokenize = this.getFirstInvalidLine();

            if (!lineToTokenize || lineToTokenize.lineNumber > lineNumber) {
                break;
            }

            const text = this.jsonModel.getLineContent(lineToTokenize.lineNumber);
            const result = this.tokenizationSupport.tokenize(text, lineToTokenize.startState);
            backgroundTokenizationStore.setTokens(lineToTokenize.lineNumber, result.tokens);

            this.store.setEndState(lineToTokenize.lineNumber, result.endState);
        }
    }
}

export class TrackingTokenizationStateStore {
    readonly #tokenizationStateStore = new TokenizationStateStore();
    readonly #invalidatedLines = new RangePriorityQueue();
    #lineCount: number;
    constructor(lineCount: number) {
        this.#lineCount = lineCount;
        this.#invalidatedLines.addRange(new OffsetRange(1, lineCount + 1));
    }

    getEndState(lineNumber: number) {
        return this.#tokenizationStateStore.getEndState(lineNumber);
    }

    setEndState(lineNumber: number, state: JSONState) {
        this.#invalidatedLines.delete(lineNumber);
        const result = this.#tokenizationStateStore.setEndState(lineNumber, state);
        if (result && lineNumber < this.#lineCount) {
            this.#invalidatedLines.addRange(new OffsetRange(lineNumber + 1, lineNumber + 2));
        }
        return result;
    }

    getStartState(lineNumber: number, initialState: JSONState) {
        if (lineNumber === 1) {
            return initialState;
        }
        return this.getEndState(lineNumber - 1);
    }

    getFirstInvalidEndStateLineNumber(): number | null {
        return this.#invalidatedLines.min;
    }

    getFirstInvalidLine(initialState: JSONState): {
        lineNumber: number;
        startState: JSONState;
    } | null {
        const lineNumber = this.getFirstInvalidEndStateLineNumber();
        if (lineNumber === null) {
            return null;
        }
        const startState = this.getStartState(lineNumber, initialState);
        if (!startState) {
            throw new Error('Start state must be defined');
        }
        return {
            lineNumber,
            startState: this.getStartState(lineNumber, initialState),
        };
    }

    allStatesValid() {
        return this.#invalidatedLines.min === null;
    }

    invalidateRange({ from, to }: { from: number; to: number }) {
        this.#invalidatedLines.addRange(new OffsetRange(from, to));
    }
}

export class TokenizationStateStore {
    readonly #lineEndState = new Array<JSONState>();

    getEndState(lineNumber: number) {
        return this.#lineEndState[lineNumber];
    }

    setEndState(lineNumber: number, state: JSONState) {
        const oldState = this.#lineEndState[lineNumber];
        if (oldState && oldState.equals(state)) {
            return false;
        }
        this.#lineEndState[lineNumber] = state;
        return true;
    }
}

export class RangePriorityQueue {
    readonly #ranges: OffsetRange[] = [];

    getRange() {
        return this.#ranges;
    }

    addRange(range: OffsetRange) {
        OffsetRange.addRange(range, this.#ranges);
    }

    get min(): number | null {
        return this.#ranges[0]?.start ?? null;
    }
    /** Replaces `range` with a range of `newLength`, merging touching ranges and shifting the later ones. */
    addRangeAndResize(range: OffsetRange, newLength: number) {
        let idxFirstMightBeIntersecting = 0;
        while (!(idxFirstMightBeIntersecting >= this.#ranges.length || range.start <= this.#ranges[idxFirstMightBeIntersecting].endExclusive)) {
            idxFirstMightBeIntersecting++;
        }
        let idxFirstIsAfter = idxFirstMightBeIntersecting;
        while (!(idxFirstIsAfter >= this.#ranges.length || range.endExclusive < this.#ranges[idxFirstIsAfter].start)) {
            idxFirstIsAfter++;
        }
        const delta = newLength - range.length;
        for (let i = idxFirstIsAfter; i < this.#ranges.length; i++) {
            this.#ranges[i] = this.#ranges[i].delta(delta);
        }

        if (idxFirstMightBeIntersecting === idxFirstIsAfter) {
            const newRange = new OffsetRange(range.start, range.start + newLength);
            if (!newRange.isEmpty) {
                this.#ranges.splice(idxFirstMightBeIntersecting, 0, newRange);
            }
        } else {
            const start = Math.min(range.start, this.#ranges[idxFirstMightBeIntersecting].start);
            const endEx = Math.max(range.endExclusive, this.#ranges[idxFirstIsAfter - 1].endExclusive);
            const newRange = new OffsetRange(start, endEx + delta);
            if (!newRange.isEmpty) {
                this.#ranges.splice(idxFirstMightBeIntersecting, idxFirstIsAfter - idxFirstMightBeIntersecting, newRange);
            } else {
                this.#ranges.splice(idxFirstMightBeIntersecting, idxFirstIsAfter - idxFirstMightBeIntersecting);
            }
        }
    }
    delete(value: number) {
        const idx = this.#ranges.findIndex((r) => r.contains(value));
        if (idx !== -1) {
            const range = this.#ranges[idx];
            if (range.start === value) {
                if (range.endExclusive === value + 1) {
                    this.#ranges.splice(idx, 1);
                } else {
                    this.#ranges[idx] = new OffsetRange(value + 1, range.endExclusive);
                }
            } else {
                if (range.endExclusive === value + 1) {
                    this.#ranges[idx] = new OffsetRange(range.start, value);
                } else {
                    this.#ranges.splice(idx, 1, new OffsetRange(range.start, value), new OffsetRange(value + 1, range.endExclusive));
                }
            }
        }
    }
}

export class JsonBackgroundTokenizer {
    readonly #jsonTokenizerWithStateStoreAndModel: JsonTokenizerWithStateStoreAndModel;
    readonly #backgroundTokenizationStore: IBackgroundTokenizationStore;

    constructor(_jsonTokenizerWithStateStoreAndModel: JsonTokenizerWithStateStoreAndModel, _backgroundTokenizationStore: IBackgroundTokenizationStore) {
        this.#jsonTokenizerWithStateStoreAndModel = _jsonTokenizerWithStateStoreAndModel;
        this.#backgroundTokenizationStore = _backgroundTokenizationStore;
    }

    #beginBackgroundTokenization() {
        runWhenGlobalIdle((deadline: IdleDeadline) => {
            this.#backgroundTokenizeWithDeadline(deadline);
        });
    }

    #backgroundTokenizeWithDeadline(deadline: IdleDeadline) {
        const endTime = Date.now() + deadline.timeRemaining();

        const execute = () => {
            if (!this.#hasLinesToTokenize()) return;
            this.#backgroundTokenize();

            if (Date.now() < endTime) {
                setTimeout(execute);
            } else {
                this.#beginBackgroundTokenization();
            }
        };
        execute();
    }

    #backgroundTokenize() {
        const lineCount = this.#jsonTokenizerWithStateStoreAndModel.jsonModel.getLineCount();
        const stopWatch = StopWatch.create(true);
        do {
            if (stopWatch.elapsed() > 1) {
                break;
            }
            const tokenizedNumber = this.#tokenizeOneInvalidLine();
            if (tokenizedNumber > lineCount) {
                break;
            }
        } while (this.#hasLinesToTokenize());
    }

    #hasLinesToTokenize() {
        if (!this.#jsonTokenizerWithStateStoreAndModel) {
            return false;
        }
        return !this.#jsonTokenizerWithStateStoreAndModel.store.allStatesValid();
    }

    #tokenizeOneInvalidLine() {
        const firstInvalidLine = this.#jsonTokenizerWithStateStoreAndModel.getFirstInvalidLine();

        if (!firstInvalidLine) {
            return this.#jsonTokenizerWithStateStoreAndModel.jsonModel.getLineCount() + 1;
        }
        this.#jsonTokenizerWithStateStoreAndModel.updateTokensUntilLine(firstInvalidLine.lineNumber, this.#backgroundTokenizationStore);
        return firstInvalidLine.lineNumber;
    }

    handleChanges() {
        this.#beginBackgroundTokenization();
    }

    requestTokens({ from, to }: { from: number; to: number }) {
        this.#jsonTokenizerWithStateStoreAndModel.store.invalidateRange({
            from: from === 1 ? 1 : from - 1,
            to: to + 1,
        });
    }
}
