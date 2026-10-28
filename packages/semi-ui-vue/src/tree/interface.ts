import type { StyleValue, VNode } from 'vue';
import type { BasicExpandedOtherProps, BasicFlattenNode, BasicOnDragProps, BasicTreeNodeData, BasicTreeNodeProps, CheckRelation, ExpandAction, KeyMapProps, ScrollAlign, TreeDataSimpleJson, TreeMotionType, Virtualize } from '@fibrae/semi-foundation/tree/foundation';

export type { TreeDataSimpleJson } from '@fibrae/semi-foundation/tree/foundation';
export type TreeKeyMapProps = KeyMapProps;
export type TreeVirtualize = Virtualize;

/** A node of `treeData`; markup for its label goes in the `label` slot, an icon in the `icon` slot */
export interface TreeNodeData extends BasicTreeNodeData {
    label?: string | number;
    /** Not read: the `icon` slot draws the icon, so a VNode never sits in the data */
    icon?: never;
    children?: TreeNodeData[];
}

export type TreeValue = string | number | TreeNodeData | Array<TreeNodeData | number | string>;

export interface TreeDragNode extends TreeNodeData {
    expanded: boolean;
    /** Where the node sits in treeData, such as '0-1-2-0' for the first child of the third child of the second root */
    pos: string;
}

export interface TreeDragProps {
    event: DragEvent;
    node: TreeDragNode;
}

export interface TreeDragEnterProps extends TreeDragProps {
    /** Set when entering a collapsed node expanded it */
    expandedKeys?: string[];
}

export interface TreeOnDragProps extends BasicOnDragProps {
    event: DragEvent;
    node: TreeDragNode;
    dragNode: TreeDragNode;
}

export interface TreeExpandedOtherProps extends BasicExpandedOtherProps {
    node: TreeNodeData;
}

export interface TreeScrollData {
    key: string;
    /** `center` by default */
    align?: ScrollAlign;
}

export interface TreeProps {
    modelValue?: TreeValue;
    defaultValue?: TreeValue;
    /** Only a new array updates the tree: changes made in place are not seen */
    treeData?: TreeNodeData[];
    treeDataSimpleJson?: TreeDataSimpleJson;
    keyMaps?: TreeKeyMapProps;

    expandedKeys?: string[];
    defaultExpandedKeys?: string[];
    defaultExpandAll?: boolean;
    expandAll?: boolean;
    autoExpandParent?: boolean;
    autoExpandWhenDragEnter?: boolean;
    autoMergeValue?: boolean;
    blockNode?: boolean;
    checkRelation?: CheckRelation;
    directory?: boolean;
    disabled?: boolean;
    disableStrictly?: boolean;
    draggable?: boolean;
    hideDraggingNode?: boolean;
    expandAction?: ExpandAction;
    leafOnly?: boolean;
    loadedKeys?: string[];
    motion?: boolean;
    multiple?: boolean;
    /** `change` reports the nodes instead of their values; named without the `on` prefix, which Vue reads as a listener */
    changeWithObject?: boolean;
    showClear?: boolean;
    showFilteredOnly?: boolean;
    showLine?: boolean;
    treeNodeFilterProp?: string;
    /** On by default for a virtualized tree */
    labelEllipsis?: boolean;
    virtualize?: TreeVirtualize;
    searchClassName?: string;
    searchPlaceholder?: string;
    searchStyle?: StyleValue;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean);
    /** Loads a node's children; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (treeNode?: TreeNodeData) => Promise<void>;
}

export interface TreeEmits {
    'update:modelValue': [value: TreeValue];
    change: [value: TreeValue];
    'update:expandedKeys': [expandedKeys: string[]];
    expand: [expandedKeys: string[], info: TreeExpandedOtherProps];
    'update:loadedKeys': [loadedKeys: string[]];
    load: [loadedKeys: Set<string>, node: TreeNodeData];
    select: [selectedKey: string, selected: boolean, node: TreeNodeData];
    search: [input: string, filteredExpandedKeys: string[]];
    contextMenu: [event: MouseEvent, node: TreeNodeData];
    doubleClick: [event: MouseEvent, node: TreeNodeData];
    dragStart: [info: TreeDragProps];
    dragEnter: [info: TreeDragEnterProps];
    dragOver: [info: TreeDragProps];
    dragLeave: [info: TreeDragProps];
    dragEnd: [info: TreeDragProps];
    drop: [info: TreeOnDragProps];
}

export interface TreeLabelSlotProps {
    item: TreeNodeData;
    label: string | number | undefined;
    /** The search keyword, empty while not searching */
    searchWord: string;
}

export interface TreeIconSlotProps {
    item: TreeNodeData;
    level: number;
    expanded: boolean;
    isLeaf: boolean;
    loading: boolean;
    selected: boolean;
    checked: boolean;
    halfChecked: boolean;
}

export interface TreeExpandIconSlotProps {
    onClick: (event: MouseEvent) => void;
    class: string;
    expanded: boolean;
}

export interface TreeFullLabelSlotProps {
    data: TreeNodeData;
    level: number;
    /** The row's classes: indentation, selection, focus, drag state */
    class: string;
    /** The built-in expand arrow */
    expandIcon: VNode;
    checkStatus: { checked: boolean; halfChecked: boolean };
    expandStatus: { expanded: boolean; loading: boolean };
    filtered: boolean;
    searchWord: string;
    /** Selects the row, or checks it in a multiple tree */
    onClick: (event: MouseEvent) => void;
    onCheck: (event: MouseEvent) => void;
    onExpand: (event: MouseEvent) => void;
    onContextmenu: (event: MouseEvent) => void;
    onDblclick: (event: MouseEvent) => void;
}

export interface TreeSearchSlotProps {
    class: string;
    modelValue: string;
    placeholder: string;
    showClear: boolean;
    onChange: (value: string) => void;
}

export interface TreeDraggingNodeSlotProps {
    /** The dragged row element */
    nodeInstance: HTMLElement;
    node: TreeNodeData;
}

export interface TreeSlots {
    /** Content of a row's label */
    label?: (props: TreeLabelSlotProps) => VNode[];
    /** A row's icon; empty content keeps the directory icon */
    icon?: (props: TreeIconSlotProps) => VNode[];
    /** A single element gets the class and the click that expands */
    expandIcon?: (props: TreeExpandIconSlotProps) => VNode[];
    /** Content of a whole row; the row element carrying the id, role and state wraps it */
    fullLabel?: (props: TreeFullLabelSlotProps) => VNode[];
    /** Replaces the search box; an empty slot hides it */
    search?: (props: TreeSearchSlotProps) => VNode[];
    /** An empty slot hides the empty state */
    emptyContent?: () => VNode[];
    /** The image the browser shows while a node is dragged; rendered outside the tree, so component provides do not reach it */
    renderDraggingNode?: (props: TreeDraggingNodeSlotProps) => VNode[];
}

/** The methods on a Tree ref */
export interface TreeHandle {
    /** Searches as if typed into the search box; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Scrolls a virtualized tree to an expanded node */
    scrollTo: (scrollData: TreeScrollData) => void;
}

export interface FlattenNode extends BasicFlattenNode {
    children?: FlattenNode[];
    data?: TreeNodeData;
    label?: string | number;
    parent?: FlattenNode | null;
    isEnd?: boolean[];
}

/** One row: the foundation's node props merged with the node's data, which the foundation's handlers read */
export interface TreeRowProps extends BasicTreeNodeProps {
    key: string;
    eventKey: string;
    label?: string | number;
    data: TreeNodeData;
    level: number;
    pos: string;
    isEnd: boolean[];
    keyword: string;
    filtered: boolean;
    setsize: number;
    posinset: number;
    children?: TreeNodeData[];
}

export interface TreeNodeProps {
    row: TreeRowProps;
    /** The row's id, which the tree's aria-activedescendant points at */
    id: string;
    /** The row the keyboard is on */
    focused?: boolean;
    showLine?: boolean;
    /** The position of a virtual row */
    rowStyle?: StyleValue;
}

export interface NodeListProps {
    flattenNodes: FlattenNode[];
    /** The rows from before a collapse, which its animation still shows */
    flattenList?: FlattenNode[];
    motionKeys: Set<string>;
    motionType?: TreeMotionType | null;
    motion: boolean;
    virtualize?: TreeVirtualize;
    /** The key of a row's element, `node.key` by default */
    itemKey?: (node: FlattenNode) => PropertyKey;
    /** A search hit while expandedKeys is controlled: the rows render without the animated group */
    searchTargetIsDeep?: boolean;
}

export interface AutoSizerProps {
    defaultHeight: number | string;
    defaultWidth?: number | string;
}
