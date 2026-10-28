/** Based on https://github.com/microsoft/vscode with modifications for custom requirements */
import * as json from 'jsonc-parser';

export interface Token {
    scopes: string;
    startIndex: number;
}

export interface JsonTokenizationSupport {
    getInitialState(): JSONState;
    tokenize(line: string, state: JSONState): TokenizationResult;
}

export class TokenizationResult {
    readonly tokens: Token[];
    readonly endState: JSONState;
    constructor(tokens: Token[], endState: JSONState) {
        this.tokens = tokens;
        this.endState = endState;
    }
}

export function createTokenizationSupport(supportComments: boolean): JsonTokenizationSupport {
    return {
        getInitialState: () => new JSONState(null, null, false, null),
        tokenize: (line: string, state?: JSONState) => tokenize(supportComments, line, state),
    };
}
export interface IState {
    clone(): IState;
    equals(other: IState): boolean;
}

export const TOKEN_DELIM_OBJECT = 'delimiter-bracket';
export const TOKEN_DELIM_ARRAY = 'delimiter-array';
export const TOKEN_DELIM_COLON = 'delimiter-colon';
export const TOKEN_DELIM_COMMA = 'delimiter-comma';
export const TOKEN_VALUE_BOOLEAN = 'keyword';
export const TOKEN_VALUE_NULL = 'keyword';
export const TOKEN_VALUE_STRING = 'string-value';
export const TOKEN_VALUE_NUMBER = 'number';
export const TOKEN_PROPERTY_NAME = 'string-key';
export const TOKEN_COMMENT_BLOCK = 'comment-block';
export const TOKEN_COMMENT_LINE = 'comment-line';

const enum JSONParent {
    Object = 0,
    Array = 1,
}

class ParentsStack {
    readonly parent: ParentsStack | null;
    readonly type: JSONParent;
    readonly depth: number;
    constructor(parent: ParentsStack | null, type: JSONParent, depth: number) {
        this.parent = parent;
        this.type = type;
        this.depth = depth;
    }

    static pop(parents: ParentsStack | null) {
        if (parents) {
            return parents.parent;
        }
        return null;
    }

    static push(parents: ParentsStack | null, type: JSONParent) {
        return new ParentsStack(parents, type, parents ? parents.depth + 1 : 0);
    }

    static equals(a: ParentsStack | null, b: ParentsStack | null) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        while (a && b) {
            if (a.type !== b.type || a.depth !== b.depth) {
                return false;
            }
            a = a.parent;
            b = b.parent;
        }
        return a === null && b === null;
    }
}

export class JSONState {
    #state: IState | null;

    scanError: ScanError | null;
    lastWasColon: boolean;
    parents: ParentsStack | null;

    constructor(state: IState | null, scanError: ScanError | null, lastWasColon: boolean, parents: ParentsStack | null) {
        this.#state = state;
        this.scanError = scanError;
        this.lastWasColon = lastWasColon;
        this.parents = parents;
    }

    clone() {
        return new JSONState(this.#state, this.scanError, this.lastWasColon, this.parents);
    }

    equals(other: IState) {
        if (other === this) {
            return true;
        }
        if (!other || !(other instanceof JSONState)) {
            return false;
        }
        return this.scanError === other.scanError && this.lastWasColon === other.lastWasColon && ParentsStack.equals(this.parents, other.parents);
    }

    getStateData(): IState | null {
        return this.#state;
    }

    setStateData(state: IState) {
        this.#state = state;
    }
}

const enum ScanError {
    None = 0,
    UnexpectedEndOfComment = 1,
    UnexpectedEndOfString = 2,
    UnexpectedEndOfNumber = 3,
    InvalidUnicode = 4,
    InvalidEscapeCharacter = 5,
    InvalidCharacter = 6,
}

const enum SyntaxKind {
    OpenBraceToken = 1,
    CloseBraceToken = 2,
    OpenBracketToken = 3,
    CloseBracketToken = 4,
    CommaToken = 5,
    ColonToken = 6,
    NullKeyword = 7,
    TrueKeyword = 8,
    FalseKeyword = 9,
    StringLiteral = 10,
    NumericLiteral = 11,
    LineCommentTrivia = 12,
    BlockCommentTrivia = 13,
    LineBreakTrivia = 14,
    Trivia = 15,
    Unknown = 16,
    EOF = 17,
}

function tokenize(comments: boolean, line: string, state: JSONState, offsetDelta: number = 0) {
    let numberOfInsertedCharacters = 0;
    let adjustOffset = false;

    switch (state.scanError) {
        case ScanError.UnexpectedEndOfString:
            line = '"' + line;
            numberOfInsertedCharacters = 1;
            break;
        case ScanError.UnexpectedEndOfComment:
            line = '/*' + line;
            numberOfInsertedCharacters = 2;
            break;
    }

    const scanner = json.createScanner(line);
    let lastWasColon = state.lastWasColon;
    let parents = state.parents;

    const ret = {
        tokens: [],
        endState: state.clone(),
    };

    while (true) {
        let offset = offsetDelta + scanner.getPosition();
        let type = '';

        // jsonc-parser's const enums cannot be imported under isolated transforms, so the local mirrors are compared by value
        const kind: number = scanner.scan();
        if (kind === SyntaxKind.EOF) {
            break;
        }

        if (offset === offsetDelta + scanner.getPosition()) {
            throw new Error('Scanner did not advance, next 3 characters are: ' + line.slice(scanner.getPosition(), scanner.getPosition() + 3));
        }

        // undo the shift of the inserted /* or " prefix for every token but the first
        if (adjustOffset) {
            offset -= numberOfInsertedCharacters;
        }
        adjustOffset = numberOfInsertedCharacters > 0;

        switch (kind) {
            case SyntaxKind.OpenBraceToken:
                parents = ParentsStack.push(parents, JSONParent.Object);
                // Known limitation: bracket colors cycle through 3 depth levels.
                type = `${TOKEN_DELIM_OBJECT}-${parents ? parents.depth % 3 : 0}`;
                lastWasColon = false;
                break;
            case SyntaxKind.CloseBraceToken:
                type = `${TOKEN_DELIM_OBJECT}-${parents ? parents.depth % 3 : 0}`;
                parents = ParentsStack.pop(parents);
                lastWasColon = false;
                break;
            case SyntaxKind.OpenBracketToken:
                parents = ParentsStack.push(parents, JSONParent.Array);
                type = `${TOKEN_DELIM_ARRAY}-${parents ? parents.depth % 3 : 0}`;
                lastWasColon = false;
                break;
            case SyntaxKind.CloseBracketToken:
                type = `${TOKEN_DELIM_ARRAY}-${parents ? parents.depth % 3 : 0}`;
                parents = ParentsStack.pop(parents);
                lastWasColon = false;
                break;
            case SyntaxKind.ColonToken:
                type = TOKEN_DELIM_COLON;
                lastWasColon = true;
                break;
            case SyntaxKind.CommaToken:
                type = TOKEN_DELIM_COMMA;
                lastWasColon = false;
                break;
            case SyntaxKind.TrueKeyword:
            case SyntaxKind.FalseKeyword:
                type = TOKEN_VALUE_BOOLEAN;
                lastWasColon = false;
                break;
            case SyntaxKind.NullKeyword:
                type = TOKEN_VALUE_NULL;
                lastWasColon = false;
                break;
            case SyntaxKind.StringLiteral:
                const currentParent = parents ? parents.type : JSONParent.Object;
                const inArray = currentParent === JSONParent.Array;
                type = lastWasColon || inArray ? TOKEN_VALUE_STRING : TOKEN_PROPERTY_NAME;
                lastWasColon = false;
                break;
            case SyntaxKind.NumericLiteral:
                type = TOKEN_VALUE_NUMBER;
                lastWasColon = false;
                break;
        }

        if (comments) {
            switch (kind) {
                case SyntaxKind.LineCommentTrivia:
                    type = TOKEN_COMMENT_LINE;
                    break;
                case SyntaxKind.BlockCommentTrivia:
                    type = TOKEN_COMMENT_BLOCK;
                    break;
            }
        }

        const tokenError: number = scanner.getTokenError();
        ret.endState = new JSONState(state.getStateData(), tokenError, lastWasColon, parents);
        // @ts-ignore
        ret.tokens.push({
            startIndex: offset,
            scopes: type,
        });
    }

    return ret;
}
