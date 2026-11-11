import { getTreeKeyboardAction, isTreeNodeLeaf } from '@fibrae/semi-foundation/components/tree/shared';
import { Typeahead } from '@fibrae/semi-foundation/utils';
import type { FlattenNode, TreeRowProps } from './interface.js';

export interface TreeKeyboardOptions {
    rows: () => FlattenNode[];
    /** The row the keys act on before any is chosen, -1 for none */
    defaultIndex: () => number;
    rowProps: (node: FlattenNode) => TreeRowProps | null;
    hasLoadData: () => boolean;
    rtl: () => boolean;
    /**
     * Whether the key goes to a text field (a combobox's search input): then only Up, Down and Enter act on the
     * tree, the other keys edit the text
     */
    editing?: (event: KeyboardEvent) => boolean;
    /** Enter, and Space outside a text field: selects, or checks in a multiple tree */
    select: (event: KeyboardEvent, row: TreeRowProps) => void;
    expand: (event: KeyboardEvent, row: TreeRowProps) => void;
    reveal: (index: number, key: string) => void;
}

/**
 * The keys of an APG tree view: focus stays on the tree (or the combobox) and the keys act on the active row, which
 * aria-activedescendant points at. Right and Left swap in RTL.
 */
export default function useTreeKeyboard(options: TreeKeyboardOptions) {
    const typeahead = new Typeahead();

    // The row the keyboard or the pointer moved to; once it is no longer shown the default row takes over
    let keyboardKey = $state<string | null>(null);

    const activeIndex = $derived.by(() => {
        const index = options.rows().findIndex((node) => node.key === keyboardKey);
        return index === -1 ? options.defaultIndex() : index;
    });

    const activeKey = $derived(options.rows()[activeIndex]?.key);

    const moveTo = (index: number) => {
        const key = options.rows()[index].key!;
        keyboardKey = key;
        options.reveal(index, key);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const rows = options.rows();
        const index = activeIndex;
        const action = getTreeKeyboardAction(
            event,
            rows,
            index,
            options.editing?.(event) ?? false,
            {
                isRow: (node) => options.rowProps(node) !== null,
                isExpanded: (node) => Boolean(options.rowProps(node)?.expanded),
                isLeaf: (node) => isTreeNodeLeaf(options.rowProps(node) ?? {}, options.hasLoadData()),
                rtl: options.rtl(),
            },
            typeahead
        );
        if (!action) {
            return false;
        }
        event.preventDefault();
        const row = rows[index] ? options.rowProps(rows[index]) : null;
        if (action.type === 'move') {
            moveTo(action.index);
        } else if (row && action.type === 'select') {
            options.select(event, row);
        } else if (row && action.type !== 'none') {
            options.expand(event, row);
        }
        return true;
    };

    return {
        get activeIndex() {
            return activeIndex;
        },
        get activeKey() {
            return activeKey;
        },
        activate: (key: string) => {
            keyboardKey = key;
        },
        reset: () => {
            keyboardKey = null;
        },
        handleKeyDown,
    };
}
