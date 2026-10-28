import { type Emitter, getEmitter } from '../common/emitter';
import type { GlobalEvents, IModelContentChangeEvent } from '../common/emitterEvents';
/** Based on https://github.com/microsoft/vscode with modifications for custom requirements */
import type { JSONModel } from '../model/jsonModel';
import { JsonBackgroundTokenizer, JsonTokenizerWithStateStoreAndModel } from './jsonModelToken';
import { type Token, createTokenizationSupport } from './tokenize';

export interface IBackgroundTokenizationStore {
    setTokens(lineNumber: number, tokens: Token[]): void;
}

export class TokenizationJsonModelPart {
    readonly #tokens: GrammarTokens;
    #jsonModel: JSONModel | null = null;
    constructor(jsonModel: JSONModel) {
        this.#jsonModel = jsonModel;
        this.#tokens = new GrammarTokens(this.#jsonModel);
    }

    getLineTokens(lineNumber: number) {
        return this.#tokens.getLineTokens(lineNumber);
    }

    handleDidChangeContent(e: IModelContentChangeEvent) {
        this.#tokens.handleDidChangeContent(e);
    }

    forceTokenize(lineNumber: number) {
        this.#tokens.forceTokenize(lineNumber);
    }

    requestTokens(range: { from: number; to: number }) {
        this.#tokens.backgroundTokenizer?.requestTokens(range);
    }
}

export class GrammarTokens {
    #tokens: Map<number, Token[]> = new Map();
    #tokenizer: JsonTokenizerWithStateStoreAndModel | null = null;
    #backgroundTokenizer: JsonBackgroundTokenizer | null = null;
    #jsonModel: JSONModel;
    #emitter: Emitter<GlobalEvents> = getEmitter();
    constructor(jsonModel: JSONModel) {
        this.#jsonModel = jsonModel;
        this.#emitter.on('contentChanged', (e: IModelContentChangeEvent | IModelContentChangeEvent[]) => {
            let from = 0;
            let to = this.#jsonModel.getLineCount();
            if (Array.isArray(e)) {
                from = e[e.length - 1].range.startLineNumber;
            } else {
                from = e.range.startLineNumber;
            }
            this.#backgroundTokenizer?.requestTokens({
                from,
                to,
            });
            this.#backgroundTokenizer?.handleChanges();
        });
        this.resetTokenization();
    }

    get backgroundTokenizer() {
        return this.#backgroundTokenizer;
    }

    resetTokenization() {
        this.#tokens.clear();
        const JsonTokenizationSupport = createTokenizationSupport(true);
        const initialState = JsonTokenizationSupport.getInitialState();
        if (JsonTokenizationSupport && initialState) {
            this.#tokenizer = new JsonTokenizerWithStateStoreAndModel(this.#jsonModel.getLineCount(), JsonTokenizationSupport, this.#jsonModel);
        }

        const b: IBackgroundTokenizationStore = {
            setTokens: (lineNumber: number, tokens: Token[]) => {
                this.#tokens.set(lineNumber, tokens);
            },
        };
        if (this.#tokenizer) {
            this.#backgroundTokenizer = new JsonBackgroundTokenizer(this.#tokenizer, b);
            this.#backgroundTokenizer.handleChanges();
        }
    }
    getLineTokens(lineNumber: number) {
        return this.#tokens.get(lineNumber) || [];
    }

    handleDidChangeContent(_e: IModelContentChangeEvent) {
        this.#backgroundTokenizer?.handleChanges();
    }

    forceTokenize(lineNumber: number) {
        const b: IBackgroundTokenizationStore = {
            setTokens: (lineNumber: number, tokens: Token[]) => {
                this.#tokens.set(lineNumber, tokens);
            },
        };
        this.#tokenizer?.updateTokensUntilLine(lineNumber, b);
    }
}
