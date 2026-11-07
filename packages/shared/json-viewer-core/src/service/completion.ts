import * as Json from 'jsonc-parser';
/** Based on https://github.com/microsoft/vscode-json-languageservice with modifications for custom requirements */
import type { IPosition } from '../common/position';
import { Range } from '../common/range';
import type { CompletionOptions } from '../json-viewer/json-viewer';
import type { JSONModel } from '../model/json-model';
import type { CompletionsCollector, JSONCompletionItem } from './contribution';
import { type ASTNode, type CompletionList, type ObjectASTNode, type PropertyASTNode, CompletionItem, CompletionItemKind, InsertTextFormat, TextEdit } from './json-types';
import type { JsonDocument } from './parse';
import * as Parser from './parse';

export class JSONCompletion {
    #options: CompletionOptions | null;

    constructor(options: CompletionOptions | null) {
        this.#options = options;
    }

    #getCurrentWord(jsonModel: JSONModel, offset: number) {
        let i = offset - 1;
        const text = jsonModel.getValue();
        while (i >= 0 && ' \t\n\r\v":{[,]}'.indexOf(text.charAt(i)) === -1) {
            i--;
        }
        return text.substring(i + 1, offset);
    }

    #evaluateSeparatorAfter(jsonModel: JSONModel, offset: number) {
        const scanner = Json.createScanner(jsonModel.getValue(), true);
        scanner.setPosition(offset);
        const token = scanner.scan();
        switch (token) {
            case Json.SyntaxKind.CommaToken:
            case Json.SyntaxKind.CloseBraceToken:
            case Json.SyntaxKind.CloseBracketToken:
            case Json.SyntaxKind.EOF:
                return '';
            default:
                return ',';
        }
    }

    #getLabelForValue(value: string) {
        return JSON.stringify(value);
    }

    #getInsertTextForPlainText(text: string) {
        return text.replace(/[\\$}]/g, '\\$&');
    }

    #getInsertTextForValue(value: any, separatorAfter: string) {
        const text = JSON.stringify(value, null, '\t');
        if (text === '{}') {
            return '{$1}' + separatorAfter;
        } else if (text === '[]') {
            return '[$1]' + separatorAfter;
        }
        return this.#getInsertTextForPlainText(text + separatorAfter);
    }

    #getFilterTextForValue(value: string) {
        return JSON.stringify(value);
    }

    #getInsertTextForProperty(key: string, propertySchema: undefined, addValue: boolean, separatorAfter: string) {
        const propertyText = this.#getInsertTextForValue(key, '');
        if (!addValue) {
            return propertyText;
        }
        const resultText = propertyText + ': ';

        let value;
        const nValueProposals = 0;
        if (propertySchema) {
            // Known limitation: schema-based value proposals are not supported (no schema service).
        }
        if (!value || nValueProposals > 1) {
            value = '$1';
        }
        return resultText + value + separatorAfter;
    }

    #getSchemaLessPropertyCompletions(doc: Parser.JsonDocument, node: ASTNode, _currentKey: string, collector: CompletionsCollector, currentWord: string) {
        const collectCompletionsForSimilarObject = (obj: ObjectASTNode) => {
            obj.properties.forEach((p) => {
                const key = p.keyNode.value;
                if (key.toLowerCase().startsWith(currentWord.toLowerCase()) && currentWord !== '') {
                    collector.add({
                        kind: CompletionItemKind.Property,
                        label: key,
                        insertText: this.#getInsertTextForValue(key, ''),
                        insertTextFormat: InsertTextFormat.Snippet,
                        filterText: this.#getFilterTextForValue(key),
                        documentation: '',
                    });
                }
            });
        };
        if (node.parent) {
            if (node.parent.type === 'property') {
                const parentKey = node.parent.keyNode.value;
                doc.visit((n) => {
                    if (n.type === 'property' && n !== node.parent && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === 'object') {
                        collectCompletionsForSimilarObject(n.valueNode);
                    }
                    return true;
                });
            } else if (node.parent.type === 'array') {
                node.parent.items.forEach((n) => {
                    if (n.type === 'object' && n !== node) {
                        collectCompletionsForSimilarObject(n);
                    }
                });
            }
        }
    }

    #addFillerValueCompletions(types: { [type: string]: boolean }, separatorAfter: string, collector: CompletionsCollector) {
        if (types['object']) {
            collector.add({
                kind: this.#getSuggestionKind('object'),
                label: '{}',
                insertText: this.#getInsertTextForGuessedValue({}, separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                detail: 'New object',
                documentation: '',
            });
        }
        if (types['array']) {
            collector.add({
                kind: this.#getSuggestionKind('array'),
                label: '[]',
                insertText: this.#getInsertTextForGuessedValue([], separatorAfter),
                insertTextFormat: InsertTextFormat.Snippet,
                detail: 'New array',
                documentation: '',
            });
        }
    }

    #getInsertTextForGuessedValue(value: any, separatorAfter: string) {
        switch (typeof value) {
            case 'object':
                if (value === null) {
                    return '${1:null}' + separatorAfter;
                }
                return this.#getInsertTextForValue(value, separatorAfter);
            case 'string':
                let snippetValue = JSON.stringify(value);
                snippetValue = snippetValue.slice(1, snippetValue.length - 1);
                snippetValue = this.#getInsertTextForPlainText(snippetValue);
                return '"${1:' + snippetValue + '}"' + separatorAfter;
            case 'number':
            case 'boolean':
                return '${1:' + JSON.stringify(value) + '}' + separatorAfter;
        }
        return this.#getInsertTextForValue(value, separatorAfter);
    }

    #getSuggestionKind(type: string): CompletionItemKind {
        if (Array.isArray(type)) {
            const array = type;
            type = array.length > 0 ? array[0] : undefined;
        }
        if (!type) {
            return CompletionItemKind.Value;
        }
        switch (type) {
            case 'string':
                return CompletionItemKind.Value;
            case 'object':
                return CompletionItemKind.Module;
            case 'property':
                return CompletionItemKind.Property;
            default:
                return CompletionItemKind.Value;
        }
    }

    #getSchemaLessValueCompletions(doc: Parser.JsonDocument, node: ASTNode | undefined, offset: number, jsonModel: JSONModel, collector: CompletionsCollector) {
        let offsetForSeparator = offset;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            offsetForSeparator = node.offset + node.length;
            node = node.parent;
        }

        if (!node) {
            return;
        }
        const separatorAfter = this.#evaluateSeparatorAfter(jsonModel, offsetForSeparator);
        const collectSuggestionsForValues = (value: ASTNode) => {
            if (value.parent && !Parser.contains(value.parent, offset, true)) {
                collector.add({
                    kind: this.#getSuggestionKind(value.type),
                    label: this.#getLabelTextForMatchingNode(value, jsonModel),
                    insertText: this.#getInsertTextForMatchingNode(value, jsonModel, separatorAfter),
                    insertTextFormat: InsertTextFormat.Snippet,
                    documentation: '',
                });
            }
        };

        if (node.type === 'property') {
            if (offset > (node.colonOffset || 0)) {
                const valueNode = node.valueNode;
                if (valueNode && (offset > valueNode.offset + valueNode.length || valueNode.type === 'object' || valueNode.type === 'array')) {
                    return;
                }
                const parentKey = node.keyNode.value;
                doc.visit((n) => {
                    if (n.type === 'property' && n.keyNode.value === parentKey && n.valueNode) {
                        collectSuggestionsForValues(n.valueNode);
                    }
                    return true;
                });
            }
        }
        if (node.type === 'array') {
            if (node.parent && node.parent.type === 'property') {
                const parentKey = node.parent.keyNode.value;
                doc.visit((n) => {
                    if (n.type === 'property' && n.keyNode.value === parentKey && n.valueNode && n.valueNode.type === 'array') {
                        n.valueNode.items.forEach(collectSuggestionsForValues);
                    }
                    return true;
                });
            } else {
                node.items.forEach(collectSuggestionsForValues);
            }
        }
    }
    #getLabelTextForMatchingNode(node: ASTNode, jsonModel: JSONModel) {
        switch (node.type) {
            case 'array':
                return '[]';
            case 'object':
                return '{}';
            default:
                const content = jsonModel.getValue().slice(node.offset, node.offset + node.length);
                return content;
        }
    }

    #getInsertTextForMatchingNode(node: ASTNode, jsonModel: JSONModel, separatorAfter: string) {
        switch (node.type) {
            case 'array':
                return this.#getInsertTextForValue([], separatorAfter);
            case 'object':
                return this.#getInsertTextForValue({}, separatorAfter);
            default:
                const content = jsonModel.getValue().slice(node.offset, node.offset + node.length) + separatorAfter;
                return this.#getInsertTextForPlainText(content);
        }
    }

    doCompletion(jsonModel: JSONModel, position: IPosition, doc: JsonDocument) {
        const result: CompletionList = {
            items: [],
            isIncomplete: false,
        };
        const text = jsonModel.getValue();

        const offset = jsonModel.getOffsetAt(position.lineNumber, position.column);

        let node = doc.getNodeFromOffset(offset, true);

        if (node && offset === node.offset + node.length && offset > 0) {
            const ch = text[offset - 1];
            if ((node.type === 'object' && ch === '}') || (node.type === 'array' && ch === ']')) {
                node = node.parent;
            }
        }

        const currentWord = this.#getCurrentWord(jsonModel, offset);
        let overwriteRange: Range;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            overwriteRange = Range.create(jsonModel.positionAt(node.offset), jsonModel.positionAt(node.offset + node.length));
        } else {
            let overwriteStart = offset - currentWord.length;
            if (overwriteStart > 0 && text[overwriteStart - 1] === '"') {
                overwriteStart--;
            }
            overwriteRange = Range.create(jsonModel.positionAt(overwriteStart), position);
        }
        const proposed = new Map<string, CompletionItem>();

        const collector: CompletionsCollector = {
            add: (suggestion: JSONCompletionItem) => {
                let label = suggestion.label;
                const existing = proposed.get(label);
                if (!existing) {
                    label = label.replace(/[\n]/g, '↵');
                    if (label.length > 60) {
                        const shortenedLabel = label.substring(0, 57).trim() + '...';
                        if (!proposed.has(shortenedLabel)) {
                            label = shortenedLabel;
                        }
                    }
                    suggestion.textEdit = TextEdit.replace(overwriteRange, suggestion.insertText);
                    suggestion.label = label;
                    proposed.set(label, suggestion);
                    result.items.push(suggestion);
                } else {
                    if (!existing.documentation) {
                        existing.documentation = suggestion.documentation;
                    }
                    if (!existing.detail) {
                        existing.detail = suggestion.detail;
                    }
                    if (!existing.labelDetails) {
                        existing.labelDetails = suggestion.labelDetails;
                    }
                }
            },
            setAsIncomplete: () => {
                result.isIncomplete = true;
            },
            error: (message: string) => {
                console.error(message);
            },
            getNumberOfProposals: () => {
                return result.items.length;
            },
        };

        return Promise.resolve().then(() => {
            const collectionPromises: Promise<any>[] = [];

            let addValue = true;
            let currentKey = '';

            let currentProperty: PropertyASTNode | undefined = undefined;
            if (node) {
                if (node.type === 'string') {
                    const parent = node.parent;
                    if (parent && parent.type === 'property' && parent.keyNode === node) {
                        addValue = !parent.valueNode;
                        currentProperty = parent;
                        currentKey = text.slice(node.offset + 1, node.offset + node.length - 1);
                        if (parent) {
                            node = parent.parent;
                        }
                    }
                }
            }

            if (node && node.type === 'object') {
                if (node.offset === offset) {
                    return result;
                }
                const properties = node.properties;
                properties.forEach((p) => {
                    if (!currentProperty || currentProperty !== p) {
                        proposed.set(p.keyNode.value, CompletionItem.create('__'));
                    }
                });
                let separatorAfter = '';
                if (addValue) {
                    separatorAfter = this.#evaluateSeparatorAfter(jsonModel, jsonModel.getOffsetAt(overwriteRange.endLineNumber, overwriteRange.endColumn));
                }

                this.#getSchemaLessPropertyCompletions(doc, node, currentKey, collector, currentWord);

                if (currentWord.length > 0 && text.charAt(offset - currentWord.length - 1) !== '"') {
                    collector.add({
                        kind: CompletionItemKind.Property,
                        label: this.#getLabelForValue(currentWord),
                        insertText: this.#getInsertTextForProperty(currentWord, undefined, false, separatorAfter),
                        insertTextFormat: InsertTextFormat.Snippet,
                        documentation: '',
                    });
                    collector.setAsIncomplete();
                }
            }
            const types: { [type: string]: boolean } = {};

            this.#getSchemaLessValueCompletions(doc, node, offset, jsonModel, collector);

            return Promise.all(collectionPromises).then(() => {
                if (collector.getNumberOfProposals() === 0) {
                    let offsetForSeparator = offset;
                    if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
                        offsetForSeparator = node.offset + node.length;
                    }
                    const separatorAfter = this.#evaluateSeparatorAfter(jsonModel, offsetForSeparator);
                    this.#addFillerValueCompletions(types, separatorAfter, collector);
                } else if (this.#options?.staticCompletions) {
                    this.#options.staticCompletions.forEach((item) => {
                        collector.add({
                            label: item.label,
                            insertText: item.insertText || item.label,
                            documentation: item.documentation || '',
                        });
                    });
                }
                return result;
            });
        });
    }
}
