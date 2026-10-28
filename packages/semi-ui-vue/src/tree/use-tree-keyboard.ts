import { computed, shallowRef, type ComputedRef, type ShallowRef } from 'vue';
import { getTreeKeyboardAction, isTreeNodeLeaf } from '@fibrae/semi-foundation/tree/shared';
import { Typeahead } from '@fibrae/semi-foundation/utils/a11y';
import type { FlattenNode, TreeRowProps } from './interface';

export interface TreeKeyboardOptions {
    /** The visible rows the keys act on; none while there is no tree to act on */
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
    /** Expands or collapses the row */
    expand: (event: KeyboardEvent, row: TreeRowProps) => void;
    /** Scrolls the row the keys moved to into view */
    reveal: (index: number, key: string) => void;
}

export interface TreeKeyboard {
    /** The row the keyboard or the pointer moved to; once it is no longer shown the default row takes over */
    keyboardKey: ShallowRef<string | null>;
    activeIndex: ComputedRef<number>;
    activeKey: ComputedRef<string | undefined>;
    /** Returns whether the key was handled */
    handleKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * The keys of an APG tree view: focus stays on the tree (or the combobox) and the keys act on the active row, which
 * aria-activedescendant points at. Up and Down move between the visible rows, Home and End go to the ends, Right
 * and Left open, enter, close or leave a branch (swapped in RTL), typed characters move to the next row starting
 * with them.
 */
export default function useTreeKeyboard(options: TreeKeyboardOptions): TreeKeyboard {
    const typeahead = new Typeahead();
    const keyboardKey = shallowRef<string | null>(null);

    const activeIndex = computed(() => {
        const index = options.rows().findIndex((node) => node.key === keyboardKey.value);
        return index === -1 ? options.defaultIndex() : index;
    });

    const activeKey = computed(() => options.rows()[activeIndex.value]?.key);

    const moveTo = (index: number) => {
        const key = options.rows()[index].key as string;
        keyboardKey.value = key;
        options.reveal(index, key);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const rows = options.rows();
        const index = activeIndex.value;
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

    return { keyboardKey, activeIndex, activeKey, handleKeyDown };
}
