import type { Accessor } from 'solid-js';
import type { ExpandAction } from '@fibrae/semi-foundation/tree/foundation';
import { createContext } from '../_base/create-context';
import type { TreeProps, TreeRowProps } from './interface';

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
    renderLabel?: TreeProps['renderLabel'];
    renderFullLabel?: TreeProps['renderFullLabel'];
}

/** A host without the optional methods (TreeSelect) leaves those interactions out */
export interface TreeContextValue {
    view: Accessor<TreeContextView>;
    /** Each call reads the prop again, so an element prop builds a new element for every row */
    icon?: () => TreeProps['icon'];
    onNodeExpand: (e: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeSelect: (e: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeCheck: (e: MouseEvent | KeyboardEvent, row: TreeRowProps) => void;
    onNodeRightClick?: (e: MouseEvent, row: TreeRowProps) => void;
    onNodeDoubleClick?: (e: MouseEvent, row: TreeRowProps) => void;
    /** The drag handlers get the row element as `nodeInstance` */
    onNodeDragStart?: (e: DragEvent, row: TreeRowProps) => void;
    onNodeDragEnter?: (e: DragEvent, row: TreeRowProps) => void;
    onNodeDragOver?: (e: DragEvent, row: TreeRowProps) => void;
    onNodeDragLeave?: (e: DragEvent, row: TreeRowProps) => void;
    onNodeDragEnd?: (e: DragEvent, row: TreeRowProps) => void;
    onNodeDrop?: (e: DragEvent, row: TreeRowProps) => void;
}

export const [TreeContext, useTreeContext] = createContext<TreeContextValue>('Tree');
