/** Based on https://github.com/microsoft/vscode-json-languageservice with modifications for custom requirements */
import * as Json from 'jsonc-parser';
import type { JSONModel } from '../model/json-model';
import { type ArrayASTNode, type ASTNode, type BooleanASTNode, type NullASTNode, type NumberASTNode, type ObjectASTNode, type PropertyASTNode, type StringASTNode, Diagnostic, ErrorCode, ErrRange } from './json-types';
export function getNodeValue(node: ASTNode) {
    return Json.getNodeValue(node);
}

export function getNodePath(node: ASTNode) {
    return Json.getNodePath(node);
}

export function getPathChain(path: Json.JSONPath) {
    let result = 'root';
    for (let i = 0; i < path.length; i++) {
        if (typeof path[i] === 'number') {
            result += '[' + path[i] + ']';
        } else {
            result += '.' + path[i];
        }
    }
    return result;
}

export function contains(node: ASTNode, offset: number, includeRightBound = false) {
    return (offset >= node.offset && offset < node.offset + node.length) || (includeRightBound && offset === node.offset + node.length);
}

export abstract class ASTNodeImpl {
    abstract readonly type: 'object' | 'property' | 'array' | 'number' | 'boolean' | 'null' | 'string';

    offset: number;
    length: number;
    readonly parent: ASTNode | undefined;

    constructor(parent: ASTNode | undefined, offset: number, length: number = 0) {
        this.offset = offset;
        this.length = length;
        this.parent = parent;
    }

    get children(): ASTNode[] {
        return [];
    }

    toString() {
        return 'type: ' + this.type + ' (' + this.offset + '/' + this.length + ')' + (this.parent ? ' parent: {' + this.parent.toString() + '}' : '');
    }
}

export class NullASTNodeImpl extends ASTNodeImpl implements NullASTNode {
    type = 'null' as const;
    value: null = null;
    constructor(parent: ASTNode | undefined, offset: number) {
        super(parent, offset);
    }
}

export class BooleanASTNodeImpl extends ASTNodeImpl implements BooleanASTNode {
    type = 'boolean' as const;
    value: boolean;

    constructor(parent: ASTNode | undefined, boolValue: boolean, offset: number) {
        super(parent, offset);
        this.value = boolValue;
    }
}

export class ArrayASTNodeImpl extends ASTNodeImpl implements ArrayASTNode {
    type = 'array' as const;
    items: ASTNode[];

    constructor(parent: ASTNode | undefined, offset: number) {
        super(parent, offset);
        this.items = [];
    }

    override get children() {
        return this.items;
    }
}
export class NumberASTNodeImpl extends ASTNodeImpl implements NumberASTNode {
    type = 'number' as const;
    isInteger: boolean;
    value: number;

    constructor(parent: ASTNode | undefined, offset: number) {
        super(parent, offset);
        this.isInteger = true;
        this.value = Number.NaN;
    }
}

export class ObjectASTNodeImpl extends ASTNodeImpl implements ObjectASTNode {
    type = 'object' as const;
    properties: PropertyASTNode[];

    constructor(parent: ASTNode | undefined, offset: number) {
        super(parent, offset);

        this.properties = [];
    }

    override get children(): ASTNode[] {
        return this.properties;
    }
}

export class StringASTNodeImpl extends ASTNodeImpl implements StringASTNode {
    type = 'string' as const;
    value: string;

    constructor(parent: ASTNode | undefined, offset: number, length?: number) {
        super(parent, offset, length);
        this.value = '';
    }
}

export class PropertyASTNodeImpl extends ASTNodeImpl implements PropertyASTNode {
    type = 'property' as const;
    keyNode: StringASTNode;
    valueNode?: ASTNode;
    colonOffset: number;

    constructor(parent: ObjectASTNode | undefined, offset: number, keyNode: StringASTNode) {
        super(parent, offset);
        this.colonOffset = -1;
        this.keyNode = keyNode;
    }

    override get children() {
        return this.valueNode ? [this.keyNode, this.valueNode] : [this.keyNode];
    }
}

export class JsonDocument {
    readonly root: ASTNode | undefined;
    constructor(root?: ASTNode) {
        this.root = root;
    }

    getNodeFromOffset(offset: number, includeRightBound = false): ASTNode | undefined {
        if (!this.root) {
            return undefined;
        }
        return <ASTNode>Json.findNodeAtOffset(this.root, offset, includeRightBound);
    }

    visit(visitor: (node: ASTNode) => boolean) {
        if (this.root) {
            const doVisit = (node: ASTNode) => {
                let ctn = visitor(node);
                const children = node.children;
                if (Array.isArray(children)) {
                    for (let i = 0; i < children.length && ctn; i++) {
                        ctn = doVisit(children[i]);
                    }
                }
                return ctn;
            };
            doVisit(this.root);
        }
    }
}

export function parseJson(jsonModel: JSONModel) {
    const problems: Diagnostic[] = [];
    let lastProblemOffset = -1;
    const text = jsonModel.getValue();
    const scanner = Json.createScanner(text, false);
    const _scanNext = (): Json.SyntaxKind => {
        while (true) {
            const token = scanner.scan();
            _checkScanError();

            switch (token) {
                case Json.SyntaxKind.LineBreakTrivia:
                case Json.SyntaxKind.Trivia:
                    break;
                default:
                    return token;
            }
        }
    };

    const _checkScanError = () => {
        switch (scanner.getTokenError()) {
            case Json.ScanError.InvalidUnicode:
                _error('Invalid unicode sequence in string.', ErrorCode.InvalidUnicode);
                return true;
            case Json.ScanError.InvalidEscapeCharacter:
                _error('Invalid escape character in string.', ErrorCode.InvalidEscapeCharacter);
                return true;
            case Json.ScanError.UnexpectedEndOfNumber:
                _error('Unexpected end of number.', ErrorCode.UnexpectedEndOfNumber);
                return true;
            case Json.ScanError.UnexpectedEndOfComment:
                _error('Unexpected end of comment.', ErrorCode.UnexpectedEndOfComment);
                return true;
            case Json.ScanError.UnexpectedEndOfString:
                _error('Unexpected end of string.', ErrorCode.UnexpectedEndOfString);
                return true;
            case Json.ScanError.InvalidCharacter:
                _error('Invalid characters in string. Control characters must be escaped.', ErrorCode.InvalidCharacter);
                return true;
        }
        return false;
    };

    const _errorAtRange = (message: string, code: ErrorCode, startOffset: number, endOffset: number) => {
        if (problems.length === 0 || startOffset !== lastProblemOffset) {
            const range = ErrRange.create(jsonModel.positionAt(startOffset), jsonModel.positionAt(endOffset));
            problems.push(Diagnostic.create(message, code, range));
            lastProblemOffset = startOffset;
        }
        return;
    };

    const _finalize = <T extends ASTNodeImpl>(node: T, scanNext: boolean) => {
        node.length = scanner.getTokenOffset() + scanner.getTokenLength() - node.offset;

        if (scanNext) {
            _scanNext();
        }

        return node;
    };

    const _error = <T extends ASTNodeImpl>(message: string, code: ErrorCode, node: T | undefined = undefined, skipUntilAfter: Json.SyntaxKind[] = [], skipUntil: Json.SyntaxKind[] = []) => {
        let start = scanner.getTokenOffset();
        let end = scanner.getTokenOffset() + scanner.getTokenLength();
        if (start === end && start > 0) {
            start--;
            while (start > 0 && /\s/.test(text.charAt(start))) {
                start--;
            }
            end = start + 1;
        }
        _errorAtRange(message, code, start, end);
        if (node) {
            _finalize(node, false);
        }
        if (skipUntilAfter.length + skipUntil.length > 0) {
            let token = scanner.getToken();
            while (token !== Json.SyntaxKind.EOF) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    _scanNext();
                    break;
                } else if (skipUntil.indexOf(token) !== -1) {
                    break;
                }
                token = _scanNext();
            }
        }
        return node;
    };

    const _parseArray = (parent?: ASTNode): ArrayASTNode | undefined => {
        if (scanner.getToken() !== Json.SyntaxKind.OpenBracketToken) {
            return undefined;
        }
        const node = new ArrayASTNodeImpl(parent, scanner.getTokenOffset());
        _scanNext();

        let needComma = false;
        while (scanner.getToken() !== Json.SyntaxKind.CloseBracketToken && scanner.getToken() !== Json.SyntaxKind.EOF) {
            if (scanner.getToken() === Json.SyntaxKind.CommaToken) {
                if (!needComma) {
                    _error('Value expected.', ErrorCode.ValueExpected);
                }
                const commaOffset = scanner.getTokenOffset();
                _scanNext();
                if (scanner.getToken() === Json.SyntaxKind.CloseBracketToken) {
                    if (needComma) {
                        _errorAtRange('Trailing comma', ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
                    }
                    continue;
                }
            } else if (needComma) {
                _error('Comma expected.', ErrorCode.CommaExpected, undefined, [], [Json.SyntaxKind.CloseBracketToken]);
                break;
            }
            const item = _parseValue(node);
            if (!item) {
                _error('Value expected.', ErrorCode.ValueExpected, undefined, [], [Json.SyntaxKind.CloseBracketToken]);
                break;
            } else {
                node.items.push(item);
            }
            needComma = true;
        }

        if (scanner.getToken() !== Json.SyntaxKind.CloseBracketToken) {
            return _error('Expected comma or closing bracket', ErrorCode.CommaOrCloseBraceExpected, node);
        }
        return _finalize(node, true);
    };

    const keyPlaceholder = new StringASTNodeImpl(undefined, 0, 0);

    const _parseProperty = (parent: ObjectASTNode | undefined, keysSeen: { [key: string]: PropertyASTNode | boolean }): PropertyASTNode | undefined => {
        const node = new PropertyASTNodeImpl(parent, scanner.getTokenOffset(), keyPlaceholder);
        let key = _parseString(node);
        if (!key) {
            if (scanner.getToken() === Json.SyntaxKind.Unknown) {
                _error('Property keys must be doublequoted', ErrorCode.PropertyKeysMustBeDoublequoted);
                const keyNode = new StringASTNodeImpl(node, scanner.getTokenOffset(), scanner.getTokenLength());
                keyNode.value = scanner.getTokenValue();
                key = keyNode;
                _scanNext();
            } else {
                return undefined;
            }
        }
        node.keyNode = key;

        // JSON files that forbid comments conventionally use the key "//" for them; repeats are fine
        if (key.value !== '//') {
            const seen = keysSeen[key.value];
            if (seen) {
                _errorAtRange('Duplicate object key', ErrorCode.DuplicateKey, node.keyNode.offset, node.keyNode.offset + node.keyNode.length);
                if (typeof seen === 'object') {
                    _errorAtRange('Duplicate object key', ErrorCode.DuplicateKey, seen.keyNode.offset, seen.keyNode.offset + seen.keyNode.length);
                }
                keysSeen[key.value] = true; // avoid reporting the same duplicate again
            } else {
                keysSeen[key.value] = node;
            }
        }

        if (scanner.getToken() === Json.SyntaxKind.ColonToken) {
            node.colonOffset = scanner.getTokenOffset();
            _scanNext();
        } else {
            _error('Colon expected', ErrorCode.ColonExpected);
            if (scanner.getToken() === Json.SyntaxKind.StringLiteral && jsonModel.positionAt(key.offset + key.length).lineNumber < jsonModel.positionAt(scanner.getTokenOffset()).lineNumber) {
                node.length = key.length;
                return node;
            }
        }
        const value = _parseValue(node);
        if (!value) {
            return _error('Value expected', ErrorCode.ValueExpected, node, [], [Json.SyntaxKind.CloseBraceToken, Json.SyntaxKind.CommaToken]);
        }
        node.valueNode = value;
        node.length = value.offset + value.length - node.offset;
        return node;
    };

    const _parseObject = (parent?: ASTNode): ObjectASTNode | undefined => {
        if (scanner.getToken() !== Json.SyntaxKind.OpenBraceToken) {
            return undefined;
        }
        const node = new ObjectASTNodeImpl(parent, scanner.getTokenOffset());
        const keysSeen: any = Object.create(null);
        _scanNext();
        let needsComma = false;

        while (scanner.getToken() !== Json.SyntaxKind.CloseBraceToken && scanner.getToken() !== Json.SyntaxKind.EOF) {
            if (scanner.getToken() === Json.SyntaxKind.CommaToken) {
                if (!needsComma) {
                    _error('Property expected', ErrorCode.PropertyExpected);
                }
                const commaOffset = scanner.getTokenOffset();
                _scanNext();
                if (scanner.getToken() === Json.SyntaxKind.CloseBraceToken) {
                    if (needsComma) {
                        _errorAtRange('Trailing comma', ErrorCode.TrailingComma, commaOffset, commaOffset + 1);
                    }
                    continue;
                }
            } else if (needsComma) {
                _error('Expected comma', ErrorCode.CommaExpected);
            }
            const property = _parseProperty(node, keysSeen);
            if (!property) {
                _error('Property expected', ErrorCode.PropertyExpected, undefined, [], [Json.SyntaxKind.CloseBraceToken, Json.SyntaxKind.CommaToken]);
            } else {
                node.properties.push(property);
            }
            needsComma = true;
        }

        if (scanner.getToken() !== Json.SyntaxKind.CloseBraceToken) {
            return _error('Expected comma or closing brace', ErrorCode.CommaOrCloseBraceExpected, node);
        }
        return _finalize(node, true);
    };

    const _parseString = (parent?: ASTNode): StringASTNode | undefined => {
        if (scanner.getToken() !== Json.SyntaxKind.StringLiteral) {
            return undefined;
        }

        const node = new StringASTNodeImpl(parent, scanner.getTokenOffset());
        node.value = scanner.getTokenValue();

        return _finalize(node, true);
    };

    const _parseNumber = (parent?: ASTNode): NumberASTNode | undefined => {
        if (scanner.getToken() !== Json.SyntaxKind.NumericLiteral) {
            return undefined;
        }

        const node = new NumberASTNodeImpl(parent, scanner.getTokenOffset());
        if (scanner.getTokenError() === Json.ScanError.None) {
            const tokenValue = scanner.getTokenValue();
            try {
                const numberValue = JSON.parse(tokenValue);
                if (typeof numberValue !== 'number') {
                    return _error('Invalid number format.', ErrorCode.Undefined, node);
                }
                node.value = numberValue;
            } catch (e) {
                return _error('Invalid number format.', ErrorCode.Undefined, node);
            }
            node.isInteger = tokenValue.indexOf('.') === -1;
        }
        return _finalize(node, true);
    };

    const _parseLiteral = (parent?: ASTNode): ASTNode | undefined => {
        switch (scanner.getToken()) {
            case Json.SyntaxKind.NullKeyword:
                return _finalize(new NullASTNodeImpl(parent, scanner.getTokenOffset()), true);
            case Json.SyntaxKind.TrueKeyword:
                return _finalize(new BooleanASTNodeImpl(parent, true, scanner.getTokenOffset()), true);
            case Json.SyntaxKind.FalseKeyword:
                return _finalize(new BooleanASTNodeImpl(parent, false, scanner.getTokenOffset()), true);
            default:
                return undefined;
        }
    };

    const _parseValue = (parent?: ASTNode): ASTNode | undefined => {
        return _parseArray(parent) || _parseObject(parent) || _parseString(parent) || _parseNumber(parent) || _parseLiteral(parent);
    };

    let _root: ASTNode | undefined = undefined;

    const token = _scanNext();

    if (token !== Json.SyntaxKind.EOF) {
        _root = _parseValue(_root);
        if (!_root) {
            _error('Expected a JSON object, array or literal', ErrorCode.Undefined);
        } else if (scanner.getToken() !== Json.SyntaxKind.EOF) {
            _error('End of file expected.', ErrorCode.Undefined);
        }
    }

    return {
        problems,
        root: new JsonDocument(_root),
    };
}
