import type { ExpandAction } from '@fibrae/semi-foundation/tree/foundation';
import { createContext } from '../_base/create-context.js';
import type { TreeRowProps } from './interface.js';

/** A host without the optional methods (TreeSelect) leaves those interactions out; the fields are getters */
export interface TreeContextValue {
    readonly treeDisabled: boolean;
    readonly multiple: boolean;
    readonly draggable: boolean;
    readonly directory: boolean;
    readonly expandAction: ExpandAction;
    /** With loadData a node without isLeaf is a branch until it loads empty */
    readonly hasLoadData: boolean;
    readonly labelEllipsis: boolean;
    readonly dragOverNodeKey: string | null;
    readonly dropPosition: number | null;
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

export const [getTreeContext, setTreeContext] = createContext<TreeContextValue>('Tree or TreeSelect');
