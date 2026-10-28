import type { ComputedRef } from 'vue';
import type { ExpandAction } from '@fibrae/semi-foundation/tree/foundation';
import { createContext } from '../_base/create-context';
import type { TreeRowProps } from './interface';

export interface TreeContextView {
    treeDisabled: boolean;
    multiple: boolean;
    draggable: boolean;
    directory: boolean;
    expandAction: ExpandAction;
    /** With loadData a node without isLeaf is a branch until it loads empty */
    hasLoadData: boolean;
    labelEllipsis: boolean;
    dragOverNodeKey: string | null;
    dropPosition: number | null;
}

/** A host without the optional methods (TreeSelect) leaves those interactions out */
export interface TreeContextValue {
    view: ComputedRef<TreeContextView>;
    onNodeExpand: (event: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeSelect: (event: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeCheck: (event: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeRightClick?: (event: MouseEvent, row: TreeRowProps) => void;
    onNodeDoubleClick?: (event: MouseEvent, row: TreeRowProps) => void;
    /** The drag handlers get the row element as `nodeInstance` */
    onNodeDragStart?: (event: DragEvent, row: TreeRowProps) => void;
    onNodeDragEnter?: (event: DragEvent, row: TreeRowProps) => void;
    onNodeDragOver?: (event: DragEvent, row: TreeRowProps) => void;
    onNodeDragLeave?: (event: DragEvent, row: TreeRowProps) => void;
    onNodeDragEnd?: (event: DragEvent, row: TreeRowProps) => void;
    onNodeDrop?: (event: DragEvent, row: TreeRowProps) => void;
}

export const [provideTreeContext, useTreeContext] = createContext<TreeContextValue>('Tree', { optional: true });
