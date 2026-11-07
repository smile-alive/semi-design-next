import type { ResolvedPos, Schema } from '@tiptap/pm/model';
import { type EditorState, type Transaction, type Selection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorProps, EditorView } from '@tiptap/pm/view';
import { strings } from '../constants';
/**
 * Inserts or removes zero-width characters around custom slot nodes, because:
 *  1. The caret height follows its neighbouring content; a custom node as the last child would stretch the caret.
 *  2. An editable inline node (such as input-slot) as the last child would leave no position for the caret after it.
 */
export function handleZeroWidthCharLogic(newState: EditorState) {
    let todoPositions = [];
    let { tr } = newState;
    newState.doc.descendants((node, pos, parent) => {
        if (node.type.name === 'paragraph' && node.childCount > 0) {
            const { lastChild, firstChild } = node;
            if (firstChild && firstChild.attrs.isCustomSlot) {
                // lets the caret move before a leading custom node
                todoPositions.push(pos + 1);
            }

            if (lastChild && lastChild.attrs.isCustomSlot) {
                const paragraphEndPos = pos + node.nodeSize - 1;
                const prevChar = tr.doc.textBetween(paragraphEndPos - 1, paragraphEndPos, '', '');
                if (prevChar !== strings.ZERO_WIDTH_CHAR) {
                    todoPositions.push(paragraphEndPos);
                }
            }
            if (lastChild === firstChild && lastChild.isText && lastChild.text === strings.ZERO_WIDTH_CHAR) {
                todoPositions.push(['remove', pos + 1]);
            }
        }
        // an empty inputSlot (from undo or setContent) needs a character to render and hold the caret
        if (node.type.name === 'inputSlot' && node.content.size === 0) {
            todoPositions.push(pos + 1);
        }
        // adjacent custom slots get a character between them so the caret can sit there with the right height
        if (node.attrs.isCustomSlot) {
            let nodeIndex = -1;
            parent.forEach((child, _offset, i) => {
                if (child === node) {
                    nodeIndex = i;
                }
            });
            if (nodeIndex > -1 && nodeIndex < parent.childCount - 1) {
                const nextSibling = parent.child(nodeIndex + 1);
                if (nextSibling.attrs.isCustomSlot) {
                    todoPositions.push(pos + node.nodeSize);
                }
            }
        }
    });
    if (todoPositions.length > 0) {
        // apply from the end so earlier inserts do not shift later positions
        todoPositions
            .toSorted((a, b) => {
                const aOrder = Array.isArray(a) ? a[1] : a;
                const bOrder = Array.isArray(b) ? b[1] : b;
                return bOrder - aOrder;
            })
            .forEach((insertPos) => {
                if (Array.isArray(insertPos) && insertPos[0] === 'remove') {
                    tr = tr.delete(insertPos[1], insertPos[1] + 1);
                } else {
                    tr = tr.insertText(strings.ZERO_WIDTH_CHAR, insertPos, insertPos);
                }
            });
        return tr;
    }
    return null;
}

/** The `someProp` each guarded view had before the guard: kept beside the view, not on it, since the view is ProseMirror's */
const originalSomeProp = new WeakMap<EditorView, EditorView['someProp']>();

/**
 * ProseMirror's `readDOMChange()` synthesizes a Backspace through `document.createEvent("Event")` for deletion-like DOM
 * diffs; it is not a real KeyboardEvent but still reaches `handleKeyDown`.
 */
function isSyntheticBackspaceEvent(event: KeyboardEvent) {
    return event?.type === 'keydown' && event?.key === 'Backspace' && (event.isTrusted === false || !(event instanceof KeyboardEvent));
}

/**
 * Wraps `view.someProp("handleKeyDown")` to ignore only the synthetic Backspace replay inside `inputSlot` during IME
 * composition; a real Backspace must pass through unchanged.
 */
function installSyntheticBackspaceGuard(view: EditorView) {
    if (originalSomeProp.has(view)) {
        return;
    }

    const origSomeProp = view.someProp.bind(view);
    originalSomeProp.set(view, origSomeProp);

    function guardedSomeProp<PropName extends keyof EditorProps, Result>(propName: PropName, f: (value: NonNullable<EditorProps[PropName]>) => Result): Result | undefined;
    function guardedSomeProp<PropName extends keyof EditorProps>(propName: PropName): NonNullable<EditorProps[PropName]> | undefined;
    function guardedSomeProp(propName: keyof EditorProps, f?: (value: unknown) => unknown) {
        if (!f) {
            return origSomeProp(propName);
        }
        if (propName !== 'handleKeyDown') {
            return origSomeProp(propName, f);
        }
        return origSomeProp('handleKeyDown', (prop) =>
            f((innerView: EditorView, event: KeyboardEvent) => {
                if (innerView.composing && innerView.state.selection.$from.parent.type.name === 'inputSlot' && isSyntheticBackspaceEvent(event)) {
                    return false;
                }

                return prop(innerView, event);
            })
        );
    }

    view.someProp = guardedSomeProp;
}

function removeSyntheticBackspaceGuard(view: EditorView) {
    const origSomeProp = originalSomeProp.get(view);
    if (!origSomeProp) {
        return;
    }

    view.someProp = origSomeProp;
    originalSomeProp.delete(view);
}

export function ensureTrailingText(_schema: Schema) {
    return new Plugin({
        view(view) {
            installSyntheticBackspaceGuard(view);

            return {
                destroy() {
                    removeSyntheticBackspaceGuard(view);
                },
            };
        },
        appendTransaction(transactions, _oldState, newState) {
            if (transactions.some((tr) => tr.getMeta('composition'))) {
                return null;
            }
            if (transactions.some((tr) => tr.getMeta(strings.SKIP_ZERO_WIDTH_NORMALIZE_META))) {
                return null;
            }
            const docChanged = transactions.some((tr) => tr.docChanged);
            if (!docChanged) return null;
            return handleZeroWidthCharLogic(newState);
        },
    });
}

export function keyDownHandlePlugin(_schema: Schema) {
    return new Plugin({
        key: new PluginKey('prevent-empty-inline-node'),
        props: {
            handleKeyDown(view, event) {
                if (view.composing) {
                    return false;
                }
                const { state, dispatch } = view;
                const { selection } = state;
                const { $from } = selection;
                const node = $from.node();
                if (event.key === 'ArrowLeft' && node.type.name !== 'inputSlot') {
                    if ($from.nodeBefore && $from.nodeBefore.isText && $from.nodeBefore.text) {
                        if ($from.nodeBefore.text === strings.ZERO_WIDTH_CHAR) {
                            const parent = $from.parent;
                            const index = $from.index();
                            if (index >= 2) {
                                // [customSlot, ZWC, caret] + ArrowLeft: caret enters an input-slot's end
                                // or goes before a slot
                                const secondBeforeCursorNode = parent.child(index - 2);
                                if (secondBeforeCursorNode.attrs.isCustomSlot) {
                                    const nextCursorPos = $from.pos - 2;
                                    dispatch(state.tr.setSelection(TextSelection.create(state.doc, nextCursorPos)));
                                    event.preventDefault();
                                    return true;
                                }
                            } else if (index === 1 && $from.pos !== 0) {
                                // [previous paragraph, line break, ZWC, caret] + ArrowLeft:
                                // caret to previous paragraph end
                                const nextCursorPos = $from.before() - 1;
                                if (nextCursorPos > 0) {
                                    dispatch(state.tr.setSelection(TextSelection.create(state.doc, nextCursorPos)));
                                }
                                event.preventDefault();
                                return true;
                            }
                        } else if ($from.nodeBefore.text.endsWith(strings.ZERO_WIDTH_CHAR)) {
                            const nextCursorPos = $from.pos - 2;
                            dispatch(state.tr.setSelection(TextSelection.create(state.doc, nextCursorPos)));
                            event.preventDefault();
                            return true;
                        }
                    }
                }
                if (event.key === 'ArrowRight' && node.type.name !== 'inputSlot') {
                    if ($from.nodeAfter && $from.nodeAfter.isText) {
                        if ($from.nodeAfter.text === strings.ZERO_WIDTH_CHAR) {
                            const parent = $from.parent;
                            const index = $from.index();
                            if (index < parent.children.length - 1) {
                                // [caret, ZWC, customSlot] + ArrowRight: caret enters an input-slot's start
                                // or goes after a slot
                                const secondAfterCursorNode = parent.child(index + 1);
                                if (secondAfterCursorNode.attrs.isCustomSlot) {
                                    const newPos = $from.pos + 2;
                                    dispatch(state.tr.setSelection(TextSelection.create(state.doc, newPos)));
                                    event.preventDefault();
                                    return true;
                                }
                            } else if (index === parent.children.length - 1 && state.doc.lastChild !== node) {
                                // [caret, ZWC, line break, next paragraph] + ArrowRight: caret to next paragraph
                                const nextCursorPos = $from.after() + 1;
                                dispatch(state.tr.setSelection(TextSelection.create(state.doc, nextCursorPos)));
                                event.preventDefault();
                                return true;
                            }
                        } else if ($from.nodeAfter.text.startsWith(strings.ZERO_WIDTH_CHAR)) {
                            const nextCursorPos = $from.pos + 2;
                            dispatch(state.tr.setSelection(TextSelection.create(state.doc, nextCursorPos)));
                            event.preventDefault();
                            return true;
                        }
                    }
                }

                if (event.key === 'Backspace' && selection.empty) {
                    const beforeNode = $from.nodeBefore;
                    const afterNode = $from.nodeAfter;
                    // [one-char text, caret, customSlot] + Backspace: swap the char for a ZWC, or it cannot be deleted
                    if ($from.nodeBefore && $from.nodeBefore.isText && $from.nodeBefore.text?.length === 1 && $from.nodeBefore.text !== strings.ZERO_WIDTH_CHAR && $from.nodeAfter && $from.nodeAfter.attrs.isCustomSlot) {
                        const begin = $from.pos - $from.nodeBefore.nodeSize;
                        const end = $from.pos;
                        let tr = state.tr.delete(begin, end);
                        tr = tr.insertText(strings.ZERO_WIDTH_CHAR, begin, begin);
                        dispatch(tr);
                        event.preventDefault();
                        return true;
                    }
                    // [optional ZWC, customSlot, caret, optional ZWC] + Backspace: remove the slot with its ZWCs
                    if (beforeNode && beforeNode.attrs.isCustomSlot) {
                        const parent = $from.parent;
                        const index = $from.index();
                        const initalStart = $from.pos - beforeNode.nodeSize;
                        const intialEnd = $from.pos;
                        let deleteStart = initalStart;
                        let deleteEnd = intialEnd;
                        if (index > 1) {
                            const prevPrevNode = parent.child(index - 2);
                            if (prevPrevNode && prevPrevNode.isText && prevPrevNode.text.endsWith(strings.ZERO_WIDTH_CHAR)) {
                                deleteStart = deleteStart - 1;
                            }
                        }
                        if (afterNode?.isText && afterNode.text.startsWith(strings.ZERO_WIDTH_CHAR)) {
                            deleteEnd = deleteEnd + 1;
                        }
                        if (deleteStart !== initalStart || deleteEnd !== intialEnd) {
                            const tr = state.tr.delete(deleteStart, deleteEnd);
                            dispatch(tr);
                            event.preventDefault();
                            return true;
                        }
                    }

                    if (afterNode && afterNode.isText && afterNode.text === strings.ZERO_WIDTH_CHAR) {
                        const index = $from.index();
                        if (index === 0 && $from.pos !== 1) {
                            // [previous paragraph, line break, caret, ZWC] + Backspace: merge into previous paragraph
                            const startPos = selection.from - 2;
                            const tr = state.tr.delete(startPos, selection.to + 1);
                            dispatch(tr);
                            event.preventDefault();
                            return true;
                        }
                    }
                    if (beforeNode && beforeNode.isText && beforeNode.text === strings.ZERO_WIDTH_CHAR) {
                        const parent = $from.parent;
                        const index = $from.index();
                        if (index > 1) {
                            // [customSlot, ZWC, caret] + Backspace: remove the slot together with the ZWC
                            const prevPrevNode = parent.child(index - 2);
                            if (prevPrevNode.attrs.isCustomSlot) {
                                const deleteStart = $from.pos - beforeNode.nodeSize - prevPrevNode.nodeSize;
                                const tr = state.tr.delete(deleteStart, $from.pos);
                                dispatch(tr);
                                event.preventDefault();
                                return true;
                            }
                        } else if (index === 1 && node.type.name !== 'inputSlot') {
                            // [previous paragraph, line break, ZWC, caret, customSlot] + Backspace: merge paragraphs
                            if ($from.pos !== 1) {
                                const startPos = selection.from - 1 - 2;
                                const tr = state.tr.delete(startPos, selection.to);
                                dispatch(tr);
                                event.preventDefault();
                                return true;
                            }
                        }
                    } else {
                        // Backspace at the start of an inputSlot: move before the preceding ZWC (adding one if missing)
                        if (node.type.name === 'inputSlot' && $from.pos === $from.start()) {
                            const grandParent = $from.node($from.depth - 1);
                            let parentPrevNode = null;
                            const parentIndex = $from.index($from.depth - 1);
                            if (parentIndex > 0) {
                                parentPrevNode = grandParent.child(parentIndex - 1);
                                if (parentPrevNode && parentPrevNode.isText && parentPrevNode.text.endsWith(strings.ZERO_WIDTH_CHAR)) {
                                    const pos = $from.pos - 2;
                                    dispatch(state.tr.setSelection(TextSelection.create(state.doc, pos)));
                                    event.preventDefault();
                                    return true;
                                }
                            }
                            const pos = $from.pos - 1;
                            let tr = state.tr.insertText(strings.ZERO_WIDTH_CHAR, pos, pos + 1);
                            tr = tr.setSelection(TextSelection.create(tr.doc, pos));
                            dispatch(tr);
                            event.preventDefault();
                            return true;
                        }
                    }
                }

                if (event.key === 'Backspace' && !selection.empty) {
                    let startPos = selection.from;
                    let endPos = selection.to;
                    const nodeBefore = $from.nodeBefore;
                    const nodeAfter = $from.nodeAfter;
                    if (nodeBefore && nodeBefore.isText && nodeBefore.text.endsWith(strings.ZERO_WIDTH_CHAR)) {
                        startPos -= 1;
                    }
                    if (nodeAfter && nodeAfter.isText && nodeAfter.text.startsWith(strings.ZERO_WIDTH_CHAR)) {
                        endPos += 1;
                    }
                    if (startPos !== selection.from || endPos !== selection.to) {
                        let tr = state.tr.delete(startPos, endPos);
                        dispatch(tr);
                        event.preventDefault();
                        return true;
                    }
                }

                if (node.type.name === 'inputSlot') {
                    // while the placeholder shows, one arrow key press must move the caret out of the slot
                    const slotVisibleText = node.textContent.replaceAll(strings.ZERO_WIDTH_CHAR, '');
                    if (slotVisibleText.length === 0 && node.textContent.length > 0 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                        const pos = event.key === 'ArrowLeft' ? $from.before() : $from.after();
                        if (selection.from - pos !== 1 && selection.from - pos !== -1) {
                            dispatch(state.tr.setSelection(TextSelection.create(state.doc, pos)));
                            event.preventDefault();
                            return true;
                        }
                    }
                    if (event.key === 'Backspace' && selection.empty) {
                        const visibleText = node.textContent.replaceAll(strings.ZERO_WIDTH_CHAR, '');
                        const onlyZeroWidth = node.textContent.length > 0 && visibleText.length === 0;

                        if ($from.pos === $from.end() && visibleText.length === 1) {
                            const tr = state.tr.insertText(strings.ZERO_WIDTH_CHAR, $from.start(), $from.end());
                            dispatch(tr);
                            event.preventDefault();
                            return true;
                        }

                        if (onlyZeroWidth) {
                            const pos = $from.before();
                            dispatch(state.tr.delete(pos, pos + node.nodeSize));
                            event.preventDefault();
                            return true;
                        }
                    }

                    if (!selection.empty && $from.parent === node && selection.from === $from.start() && selection.to >= $from.end() && event.key === 'Backspace') {
                        const tr = state.tr;
                        if (selection.to > $from.end()) {
                            tr.delete($from.end(), selection.to);
                        }
                        tr.insertText(strings.ZERO_WIDTH_CHAR, $from.start(), $from.end());
                        const pos = $from.start() + 1;
                        tr.setSelection(TextSelection.create(tr.doc, pos));
                        dispatch(tr);
                        event.preventDefault();
                        return true;
                    }
                }
                return false;
            },
        },
    });
}

export function handlePasteLogic({ state, dispatch }: EditorView, event: ClipboardEvent) {
    const $from = state.selection.$from;
    let tr = state.tr;
    const parentNode = $from.parent;
    if (parentNode.type.name === 'inputSlot') {
        return specialPasteLogicForInputSlot(event, $from, tr, dispatch, state.selection);
    }
    removeZeroWidthChar($from, tr);
    tr.setMeta(strings.SKIP_ZERO_WIDTH_NORMALIZE_META, true);
    dispatch(tr);
    return false;
}

/**
 * Default paste into an input-slot holding only a ZWC, or with all text selected, would delete the slot; the pasted
 * plain text replaces the content instead.
 */
export function specialPasteLogicForInputSlot(event: ClipboardEvent, $from: ResolvedPos, tr: Transaction, dispatch: (tr: Transaction) => void, selection: Selection) {
    const parentNode = $from.parent;
    const nodeText = parentNode.textContent;
    const isOnlyZeroWidth = nodeText && nodeText === strings.ZERO_WIDTH_CHAR;
    const isAllTextSelected = !selection.empty && selection.from === $from.start() && selection.to === $from.end();
    if (isOnlyZeroWidth || isAllTextSelected) {
        const pastedText = event.clipboardData?.getData('text/plain') || '';
        if (pastedText) {
            const pos = $from.start();
            tr = tr.insertText(pastedText, pos, pos + nodeText.length);
            const endPos = pos + pastedText.length;
            tr = tr.setSelection(TextSelection.create(tr.doc, endPos));
            tr.setMeta(strings.SKIP_ZERO_WIDTH_NORMALIZE_META, true);
            dispatch(tr);
            event.preventDefault();
            return true;
        }
    }
    return false;
}

export function removeZeroWidthChar($from: ResolvedPos, tr: Transaction) {
    if ($from.nodeBefore && $from.nodeBefore.isText && $from.nodeBefore.text === strings.ZERO_WIDTH_CHAR) {
        tr.delete($from.pos - $from.nodeBefore.nodeSize, $from.pos);
        return true;
    }
    if ($from.nodeAfter && $from.nodeAfter.isText && $from.nodeAfter.text === strings.ZERO_WIDTH_CHAR) {
        tr.delete($from.pos, $from.pos + $from.nodeAfter.nodeSize);
        return true;
    }
    return false;
}

export function handleCompositionEndLogic({ state, dispatch }: EditorView) {
    const $from = state.selection.$from;
    const node = $from.node();
    if (node.type.name === 'inputSlot') {
        const text = node.textContent;
        const cleanText = text.replaceAll(strings.ZERO_WIDTH_CHAR, '');
        if (cleanText.length > 0 && cleanText.length < text.length) {
            const tr = state.tr;
            tr.insertText(cleanText, $from.start(), $from.end());
            dispatch(tr);
            return;
        }
    }
    const tr = state.tr;
    if ($from.nodeBefore && $from.nodeBefore.isText) {
        const text = $from.nodeBefore.text;
        if (text?.startsWith(strings.ZERO_WIDTH_CHAR)) {
            const removeStart = $from.pos - $from.nodeBefore.nodeSize;
            const removeEnd = removeStart + 1;
            tr.delete(removeStart, removeEnd);
            dispatch(tr);
        }
    }
}

export function handleTextInputLogic({ state, dispatch }: EditorView, _from: number, _to: number, text: string) {
    const $from = state.selection.$from;
    let tr = state.tr;
    let modified = removeZeroWidthChar($from, tr);

    if (modified) {
        tr = tr.insertText(text, tr.selection.from, tr.selection.to);
        dispatch(tr);
        return true;
    }
    return false;
}
