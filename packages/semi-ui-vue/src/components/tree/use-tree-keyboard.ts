import { computed, shallowRef, type ComputedRef, type ShallowRef } from 'vue';
import { getTreeKeyboardAction, isTreeNodeLeaf } from '@fibrae/semi-foundation/components/tree/shared';
import { Typeahead } from '@fibrae/semi-foundation/utils';
import type { FlattenNode, TreeRowProps } from './interface';

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
    select: (event: KeyboardEvent, row: TreeRowProps) => void;
    expand: (event: KeyboardEvent, row: TreeRowProps) => void;
    reveal: (index: number, key: string) => void;
}

export interface TreeKeyboard {
    /** The row the keyboard or the pointer moved to; once it is no longer shown the default row takes over */
    keyboardKey: ShallowRef<string | null>;
    activeIndex: ComputedRef<number>;
    activeKey: ComputedRef<string | undefined>;
    handleKeyDown: (event: KeyboardEvent) => boolean;
}

/** The keys of an APG tree view: focus stays on the tree (or the combobox) and the keys act on the active row, which aria-activedescendant points at. */
export default function useTreeKeyboard(options: TreeKeyboardOptions): TreeKeyboard {
    const typeahead = new Typeahead();
    const keyboardKey = shallowRef<string | null>(null);

    const activeIndex = computed(() => {
        const index = options.rows().findIndex((node) => node.key === keyboardKey.value);
        return index === -1 ? options.defaultIndex() : index;
    });

    const activeKey = computed(() => options.rows()[activeIndex.value]?.key);

    const moveTo = (index: number) => {
        const key = options.rows()[index].key!;
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
