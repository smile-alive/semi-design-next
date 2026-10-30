import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { BasicExpandedOtherProps, BasicFlattenNode, BasicOnDragProps, BasicTreeNodeData, BasicTreeNodeProps, CheckRelation, ExpandAction, KeyMapProps, ScrollAlign, TreeDataSimpleJson, TreeMotionType, Virtualize } from '@fibrae/semi-foundation/tree/foundation';

export type { TreeDataSimpleJson } from '@fibrae/semi-foundation/tree/foundation';
export type TreeKeyMapProps = KeyMapProps;
export type TreeVirtualize = Virtualize;

/** A node of `treeData`; markup for its label goes in the `label` snippet, an icon in the `icon` snippet */
export interface TreeNodeData extends BasicTreeNodeData {
    label?: string | number;
    /** Not read: the `icon` snippet draws the icon, so markup never sits in the data */
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

export interface TreeLabelSnippetProps {
    item: TreeNodeData;
    label?: string | number;
    /** The search keyword, empty while not searching */
    searchWord: string;
}

export interface TreeIconSnippetProps {
    item: TreeNodeData;
    level: number;
    expanded: boolean;
    isLeaf: boolean;
    loading: boolean;
    selected: boolean;
    checked: boolean;
    halfChecked: boolean;
}

/** Put `class` and `onClick` on the element the snippet renders */
export interface TreeExpandIconSnippetProps {
    onClick: (event: MouseEvent) => void;
    class: string;
    expanded: boolean;
}

export interface TreeFullLabelSnippetProps {
    data: TreeNodeData;
    level: number;
    /** The row's classes: indentation, selection, focus, drag state */
    class: string;
    /** Renders the built-in expand arrow: `{@render expandIcon()}` */
    expandIcon: Snippet;
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

export interface TreeSearchSnippetProps {
    class: string;
    value: string;
    placeholder: string;
    showClear: boolean;
    onChange: (value: string) => void;
}

export interface TreeDraggingNodeSnippetProps {
    /** The dragged row element */
    nodeInstance: HTMLElement;
    node: TreeNodeData;
}

// The lowercase native listeners of the same names as the callbacks below stay off the props
type NativeKeys = 'onchange' | 'onselect' | 'onload' | 'oncontextmenu' | 'ondragstart' | 'ondragenter' | 'ondragover' | 'ondragleave' | 'ondragend' | 'ondrop' | 'children';

export interface TreeProps extends Omit<HTMLAttributes<HTMLDivElement>, NativeKeys> {
    /** Bindable; leave it out for an uncontrolled tree. `bind:value={get, set}` makes it fully controlled */
    value?: TreeValue;
    /** Only a new array updates the tree: changes made in place are not seen */
    treeData?: TreeNodeData[];
    treeDataSimpleJson?: TreeDataSimpleJson;
    keyMaps?: TreeKeyMapProps;
    /** Bindable, like `value` */
    expandedKeys?: string[];
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
    /** Bindable, like `value` */
    loadedKeys?: string[];
    motion?: boolean;
    multiple?: boolean;
    /** `onChange` reports the nodes instead of their values */
    onChangeWithObject?: boolean;
    showClear?: boolean;
    showFilteredOnly?: boolean;
    showLine?: boolean;
    treeNodeFilterProp?: string;
    /** On by default for a virtualized tree */
    labelEllipsis?: boolean;
    virtualize?: TreeVirtualize;
    searchClassName?: string;
    searchPlaceholder?: string;
    searchStyle?: string;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean);
    /** Loads a node's children; a node without `isLeaf` shows the expand arrow while it is set */
    loadData?: (treeNode?: TreeNodeData) => Promise<void>;
    onChange?: (value: TreeValue) => void;
    onExpand?: (expandedKeys: string[], info: TreeExpandedOtherProps) => void;
    onLoad?: (loadedKeys: Set<string>, node: TreeNodeData) => void;
    onSelect?: (selectedKey: string, selected: boolean, node: TreeNodeData) => void;
    onSearch?: (input: string, filteredExpandedKeys: string[]) => void;
    onContextMenu?: (event: MouseEvent, node: TreeNodeData) => void;
    onDoubleClick?: (event: MouseEvent, node: TreeNodeData) => void;
    onDragStart?: (info: TreeDragProps) => void;
    onDragEnter?: (info: TreeDragEnterProps) => void;
    onDragOver?: (info: TreeDragProps) => void;
    onDragLeave?: (info: TreeDragProps) => void;
    onDragEnd?: (info: TreeDragProps) => void;
    onDrop?: (info: TreeOnDragProps) => void;
    /** Content of a row's label */
    label?: Snippet<[TreeLabelSnippetProps]>;
    /** A row's icon, in place of the directory icon */
    icon?: Snippet<[TreeIconSnippetProps]>;
    expandIcon?: Snippet<[TreeExpandIconSnippetProps]>;
    /** Content of a whole row; the row element carrying the id, role and state wraps it */
    fullLabel?: Snippet<[TreeFullLabelSnippetProps]>;
    /** Replaces the search box; `false` hides it while `filterTreeNode` still filters */
    search?: Snippet<[TreeSearchSnippetProps]> | false;
    emptyContent?: Snippet;
    /** The image the browser shows while a node is dragged */
    renderDraggingNode?: Snippet<[TreeDraggingNodeSnippetProps]>;
}

/** The methods on a Tree instance from `bind:this` */
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
    rowStyle?: string;
    label?: Snippet<[TreeLabelSnippetProps]>;
    icon?: Snippet<[TreeIconSnippetProps]>;
    expandIcon?: Snippet<[TreeExpandIconSnippetProps]>;
    fullLabel?: Snippet<[TreeFullLabelSnippetProps]>;
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
    children: Snippet<[{ node: FlattenNode; style: string | undefined }]>;
}
