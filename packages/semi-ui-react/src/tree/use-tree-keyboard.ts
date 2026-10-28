import type React from 'react';
import { useState } from 'react';
import { getTreeKeyboardAction, isTreeNodeLeaf } from '@fibrae/semi-foundation/tree/shared';
import { Typeahead } from '@fibrae/semi-foundation/utils/a11y';
import type { FlattenNode, TreeNodeProps } from './interface';

export interface TreeKeyboardOptions {
    /** The visible rows the keys act on */
    rows: FlattenNode[];
    /** The row the keys act on before any is chosen, -1 for none */
    defaultIndex: number;
    rowProps: (node: FlattenNode) => TreeNodeProps | null;
    hasLoadData: boolean;
    rtl: boolean;
    /**
     * Whether the key goes to a text field (a combobox's search input): then only Up, Down and Enter act on the
     * tree, the other keys edit the text
     */
    editing?: (event: React.KeyboardEvent) => boolean;
    /** Enter, and Space outside a text field: selects, or checks in a multiple tree */
    select: (event: React.KeyboardEvent, row: TreeNodeProps) => void;
    /** Expands or collapses the row */
    expand: (event: React.KeyboardEvent, row: TreeNodeProps) => void;
    /** Scrolls the row the keys moved to into view; a deferred list may render it at another index */
    reveal: (key: string) => void;
}

export interface TreeKeyboard {
    /** The row the keyboard or the pointer moved to; once it is no longer shown the default row takes over */
    keyboardKey: string | null;
    setKeyboardKey: (key: string | null) => void;
    activeIndex: number;
    activeKey: string | undefined;
    /** Returns whether the key was handled */
    handleKeyDown: (event: React.KeyboardEvent) => boolean;
}

/**
 * The keys of an APG tree view: focus stays on the tree (or the combobox) and the keys act on the active row, which
 * aria-activedescendant points at. Up and Down move between the visible rows, Home and End go to the ends, Right
 * and Left open, enter, close or leave a branch (swapped in RTL), typed characters move to the next row starting
 * with them.
 */
export default function useTreeKeyboard({ rows, defaultIndex, rowProps, hasLoadData, rtl, editing, select, expand, reveal }: TreeKeyboardOptions): TreeKeyboard {
    const [typeahead] = useState(() => new Typeahead());
    const [keyboardKey, setKeyboardKey] = useState<string | null>(null);
    const keyboardIndex = rows.findIndex((node) => node.key === keyboardKey);
    const activeIndex = keyboardIndex === -1 ? defaultIndex : keyboardIndex;
    const activeKey = rows[activeIndex]?.key;

    const moveTo = (index: number) => {
        const { key } = rows[index];
        setKeyboardKey(key);
        reveal(key);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const action = getTreeKeyboardAction(
            event,
            rows,
            activeIndex,
            editing?.(event) ?? false,
            {
                isRow: (node) => rowProps(node) !== null,
                isExpanded: (node) => Boolean(rowProps(node)?.expanded),
                isLeaf: (node) => isTreeNodeLeaf(rowProps(node) ?? {}, hasLoadData),
                rtl,
            },
            typeahead
        );
        if (!action) {
            return false;
        }
        event.preventDefault();
        const row = rows[activeIndex] ? rowProps(rows[activeIndex]) : null;
        if (action.type === 'move') {
            moveTo(action.index);
        } else if (row && action.type === 'select') {
            select(event, row);
        } else if (row && action.type !== 'none') {
            expand(event, row);
        }
        return true;
    };

    return { keyboardKey, setKeyboardKey, activeIndex, activeKey, handleKeyDown };
}
