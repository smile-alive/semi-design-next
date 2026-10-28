import type { Accessor, JSX, Ref } from 'solid-js';
import type { BasicExpandedOtherProps, BasicFlattenNode, BasicOnDragProps, BasicRenderFullLabelProps, BasicSearchRenderProps, BasicTreeNodeData, BasicTreeNodeProps, BasicTreeProps, KeyMapProps, ScrollAlign, TreeMotionType, Virtualize } from '@fibrae/semi-foundation/tree/foundation';
import type { ElementProps } from '../_base/element-props';
import type { VirtualListHandle } from '../_base/virtual-list';

export type { KeyMapProps, ScrollAlign, Virtualize };
export type { TreeDataSimpleJson } from '@fibrae/semi-foundation/tree/foundation';

/** What a function `expandIcon` receives; put `class` and `onClick` on the element it returns */
export interface ExpandIconProps {
    onClick: (e: MouseEvent) => void;
    class: string;
    expanded: boolean;
}

/** An element gets the switcher class and the click that expands; a function renders the switcher itself */
export type ExpandIcon = JSX.Element | ((props: ExpandIconProps) => JSX.Element);

/** A node of `treeData`: data only, `renderLabel` renders markup for the label and the tree's `icon` draws icons */
export interface TreeNodeData extends BasicTreeNodeData {
    label?: string | number;
    /** Not read: JSX in data would be created where it is read, not where a row inserts it */
    icon?: never;
    children?: TreeNodeData[];
}

export type Value = string | number | TreeNodeData | Array<TreeNodeData | number | string>;

export interface DragTreeNode extends TreeNodeData {
    expanded: boolean;
    /** The node's position path in treeData, such as '0-1-2-0' */
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

/** A live object: read its fields in the returned JSX, destructuring takes only the values of the first render */
export interface RenderFullLabelProps extends Omit<BasicRenderFullLabelProps, 'className' | 'style' | 'data' | 'expandIcon' | 'onClick' | 'onContextMenu' | 'onDoubleClick' | 'onExpand' | 'onCheck'> {
    /** The row's classes: level, selection, focus, drag state */
    class: string;
    data: TreeNodeData;
    /** Creates the built-in switcher on every call: call it where the switcher is inserted */
    expandIcon: () => JSX.Element;
    /** Selects the row, or checks it in a multiple tree */
    onClick: (e: MouseEvent) => void;
    onCheck: (e: MouseEvent) => void;
    onExpand: (e: MouseEvent) => void;
    onContextMenu: (e: MouseEvent) => void;
    onDoubleClick: (e: MouseEvent) => void;
}

/** A live object, ready to spread on an Input */
export interface SearchRenderProps extends Omit<BasicSearchRenderProps, 'className' | 'prefix'> {
    class: string;
    prefix: JSX.Element;
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

export interface TreeProps
    extends
        Omit<BasicTreeProps, 'className' | 'children' | 'aria-label' | 'renderFullLabel' | 'searchRender'>,
        ElementProps<'div', 'defaultValue' | 'draggable' | 'onChange' | 'onContextMenu' | 'onDoubleClick' | 'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDragStart' | 'onDrop' | 'onLoad' | 'onSelect' | 'ref' | 'style' | 'children'> {
    defaultValue?: Value;
    /** `null` renders no empty state */
    emptyContent?: JSX.Element;
    filterTreeNode?: boolean | ((inputValue: string, treeNodeString: string, data?: TreeNodeData) => boolean);
    /** `false` hides the search box */
    searchRender?: ((searchRenderProps: SearchRenderProps) => JSX.Element) | false;
    searchStyle?: JSX.CSSProperties | string;
    style?: JSX.CSSProperties | string;
    treeData?: TreeNodeData[];
    value?: Value;
    /** Read once per row that shows it, so an element prop gives every row its own icon; a function gets the row */
    icon?: JSX.Element | ((row: TreeRowProps) => JSX.Element);
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
    /** Called once per row with a live object; the row element carrying role, aria and drag handlers wraps the result */
    renderFullLabel?: (renderFullLabelProps: RenderFullLabelProps) => JSX.Element;
    /** Called again whenever one of its arguments changes */
    renderLabel?: (label?: string | number, treeNode?: TreeNodeData, searchWord?: string) => JSX.Element;
    autoMergeValue?: boolean;
    expandIcon?: ExpandIcon;
    /** The root element with the TreeHandle methods */
    ref?: Ref<TreeElement>;
}

export interface TreeHandle {
    /** Searches as if typed into the search box; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Scrolls a virtualized tree to an expanded node */
    scrollTo: (scrollData: ScrollData) => void;
}

export type TreeElement = HTMLDivElement & TreeHandle;

export interface ScrollData {
    key: string;
    /** `center` by default */
    align?: ScrollAlign;
}

export interface TreeNodeProps {
    row: TreeRowProps;
    /** The row's id, which the tree's aria-activedescendant points at */
    id: string;
    /** The row the keyboard is on */
    focused?: boolean;
    showLine?: boolean;
    /** The position of a virtual row */
    style?: JSX.CSSProperties;
    expandIcon?: ExpandIcon;
}

export interface FlattenNode extends BasicFlattenNode {
    key: string;
    children?: FlattenNode[];
    data?: TreeNodeData;
    label?: string | number;
    parent?: FlattenNode | null;
    isEnd?: boolean[];
}

export interface NodeListProps {
    flattenNodes: FlattenNode[];
    /** The rows from before a collapse, which its animation still shows */
    flattenList?: FlattenNode[];
    motionKeys: Set<string>;
    motionType?: TreeMotionType | null;
    motion: boolean;
    virtualize?: Virtualize;
    /** Receives the virtual list's handle while one is rendered */
    listRef?: (handle?: VirtualListHandle) => void;
    /** Renders one row; `node` is undefined while the row is being removed */
    renderRow: (node: Accessor<FlattenNode | undefined>, style?: Accessor<JSX.CSSProperties>) => JSX.Element;
}
