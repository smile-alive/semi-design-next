import React, { type ReactNode, type MouseEvent, type DragEvent } from 'react';
import type {
    BasicTreeProps,
    BasicExpandedOtherProps,
    BasicRenderFullLabelProps,
    BasicSearchRenderProps,
    BasicTreeInnerData,
    BasicKeyEntities,
    BasicKeyEntity,
    BasicTreeNodeProps,
    BasicFlattenNode,
    BasicTreeNodeData,
    BasicOnDragProps,
    KeyMapProps,
    ScrollAlign,
    TreeMotionType,
} from '@fibrae/semi-foundation/tree/foundation';
import type { ElementProps } from '../_base/base';

/** A node, or a render function that receives the props the switcher needs */
export type ExpandIcon = ReactNode | ((props: { onClick: (e: MouseEvent) => void; className: string; expanded: boolean }) => ReactNode);

export type Value = string | number | TreeNodeData | Array<TreeNodeData | number | string>;

export interface DragTreeNode extends TreeNodeData {
    expanded: boolean;
    /**
     * The node's position path in treeData, such as '0-1-2-0'
     */
    pos: string;
}
export interface DragProps {
    event: DragEvent;
    node: DragTreeNode;
}
export interface OnDragProps extends BasicOnDragProps {
    event: DragEvent;
    node: DragTreeNode;
    dragNode: DragTreeNode;
}

export interface DragEnterProps extends DragProps {
    expandedKeys?: string[];
}

export interface ExpandedOtherProps extends BasicExpandedOtherProps {
    node: TreeNodeData;
}
export interface RenderFullLabelProps extends BasicRenderFullLabelProps {
    onClick: (e: MouseEvent) => void;
    onContextMenu: (e: MouseEvent) => void;
    onDoubleClick: (e: MouseEvent) => void;
    onExpand: (e: MouseEvent) => void;
    data: TreeNodeData;
    style: React.CSSProperties;
    onCheck: (e: MouseEvent) => void;
    expandIcon: ReactNode;
}
export interface SearchRenderProps extends BasicSearchRenderProps {
    prefix: ReactNode;
}
export interface TreeProps extends BasicTreeProps, ElementProps<'div', 'defaultValue' | 'draggable' | 'onChange' | 'onContextMenu' | 'onDoubleClick' | 'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDragStart' | 'onDrop' | 'onLoad' | 'onSelect'> {
    children?: ReactNode;
    defaultValue?: Value;
    emptyContent?: ReactNode;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean);
    searchRender?: ((searchRenderProps: SearchRenderProps) => ReactNode) | false;
    searchStyle?: React.CSSProperties;
    style?: React.CSSProperties;
    treeData?: TreeNodeData[];
    value?: Value;
    icon?: ReactNode | ((props: TreeNodeProps) => ReactNode);
    keyMaps?: KeyMapProps;
    loadData?: (treeNode?: TreeNodeData) => Promise<void>;
    onChange?: (value: Value) => void;
    onDoubleClick?: (e: MouseEvent, node: TreeNodeData) => void;
    onDragEnd?: (dragProps: DragProps) => void;
    onDragLeave?: (dragProps: DragProps) => void;
    onDragOver?: (dragProps: DragProps) => void;
    onDragStart?: (dragProps: DragProps) => void;
    onDragEnter?: (dragEnterProps: DragEnterProps) => void;
    onDrop?: (onDragProps: OnDragProps) => void;
    onExpand?: (expandedKeys: string[], expandedOtherProps: ExpandedOtherProps) => void;
    onLoad?: (loadedKeys?: Set<string>, treeNode?: TreeNodeData) => void;
    onContextMenu?: (e: MouseEvent, node: TreeNodeData) => void;
    onSelect?: (selectedKey: string, selected: boolean, selectedNode: TreeNodeData) => void;
    renderDraggingNode?: (nodeInstance: HTMLElement, node: TreeNodeData) => HTMLElement;
    renderFullLabel?: (renderFullLabelProps: RenderFullLabelProps) => ReactNode;
    renderLabel?: (label?: ReactNode, treeNode?: TreeNodeData, searchWord?: string) => ReactNode;
    autoMergeValue?: boolean;
    expandIcon?: ExpandIcon;
    ref?: React.Ref<TreeHandle>;
}
/** The methods a Tree ref exposes */
export interface TreeHandle {
    /** Searches as if typed into the search box; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Scrolls a virtualized tree to an expanded node */
    scrollTo: (scrollData: ScrollData) => void;
}
export interface OptionProps {
    index: number;
    style: React.CSSProperties;
    data: KeyEntity;
}
export interface KeyEntities extends BasicKeyEntities {
    [key: string]: KeyEntity;
}
export interface KeyEntity extends BasicKeyEntity {
    children?: KeyEntity[];
    data?: TreeNodeData;
    parent?: KeyEntity;
}
export interface TreeState extends BasicTreeInnerData {
    keyEntities: KeyEntities;
    treeData: TreeNodeData[];
    flattenNodes: FlattenNode[];
    prevProps: null | TreeProps;
    cachedFlattenNodes?: FlattenNode[];
}

export interface TreeNodeProps extends BasicTreeNodeProps {
    children?: TreeNodeData[];
    icon?: ReactNode;
    isEnd?: boolean[];
    /** The row's id, which aria-activedescendant points at */
    id?: string;
    /** The row the keyboard is on */
    focused?: boolean;
    expandIcon?: ExpandIcon;
}
export interface TreeNodeData extends BasicTreeNodeData {
    label?: ReactNode;
    icon?: ReactNode;
    children?: TreeNodeData[];
}
export interface FlattenNode extends BasicFlattenNode {
    children?: FlattenNode[];
    data?: BasicTreeNodeData;
    icon?: ReactNode;
    label?: ReactNode;
    parent?: null | FlattenNode;
    isEnd?: boolean[];
}
export interface NodeListProps {
    flattenNodes: FlattenNode[];
    motionKeys: Set<string>;
    motionType: TreeMotionType | null;
    flattenList?: FlattenNode[];
    searchTargetIsDeep?: boolean;
    renderTreeNode: (treeNode: FlattenNode, ind?: number, style?: React.CSSProperties) => ReactNode;
}
export type TransitionNodes<T> = Array<T | Array<T>>;
export interface NodeListState {
    transitionNodes: TransitionNodes<FlattenNode>;
    cachedMotionKeys?: Set<string>;
    cachedData?: FlattenNode[];
}

export interface ScrollData {
    key: string;
    align?: ScrollAlign;
}
