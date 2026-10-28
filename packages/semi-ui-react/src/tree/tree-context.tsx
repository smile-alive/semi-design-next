import type React from 'react';
import type { ReactNode, MouseEvent, DragEvent, KeyboardEvent } from 'react';
import type { Virtualize, ExpandAction } from '@fibrae/semi-foundation/tree/foundation';
import { createContext } from '../_base/create-context';
import type { TreeNodeData, TreeNodeProps, RenderFullLabelProps } from './interface';

export interface TreeContextValue {
    treeDisabled?: boolean;
    treeIcon?: ReactNode | ((props: TreeNodeProps) => ReactNode);
    onNodeExpand?: (e: MouseEvent | KeyboardEvent, treeNode: TreeNodeProps) => void;
    onNodeSelect?: (e: MouseEvent | KeyboardEvent, treeNode: TreeNodeProps) => void;
    onNodeCheck?: (e: MouseEvent | KeyboardEvent, treeNode: TreeNodeProps) => void;
    onNodeRightClick?: (e: MouseEvent, treeNode: TreeNodeProps) => void;
    onNodeDoubleClick?: (e: MouseEvent, treeNode: TreeNodeProps) => void;
    onNodeDragStart?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    onNodeDragEnter?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    onNodeDragOver?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    onNodeDragLeave?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    onNodeDragEnd?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    onNodeDrop?: (e: DragEvent<HTMLLIElement>, treeNode: TreeNodeProps) => void;
    expandAction?: ExpandAction;
    directory?: boolean;
    multiple?: boolean;
    loadData?: (treeNode?: TreeNodeData) => Promise<void>;
    renderLabel?: (label?: ReactNode, treeNode?: TreeNodeData, searchWord?: string) => ReactNode;
    draggable?: boolean;
    renderFullLabel?: (renderFullLabelProps: RenderFullLabelProps) => React.ReactNode;
    dragOverNodeKey?: string | null;
    dropPosition?: number | null;
    labelEllipsis?: boolean | Virtualize;
}

export const [TreeContext, useTreeContext] = createContext<TreeContextValue>('Tree');
