import type React from 'react';
import { memo, useDeferredValue, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
import TreeFoundation, { type TreeAdapter, type BasicFlattenNode, type BasicTreeProps, type BasicTreeInnerData, type ScrollAlign } from '@fibrae/semi-foundation/components/tree/foundation';
import { buildRowProps, handleTreeFocusIn, nodeId } from '@fibrae/semi-foundation/components/tree/shared';
import '@fibrae/semi-foundation/components/tree/tree.scss';
import { IconSearch } from '@fibrae/semi-icons-react';
import { useDefaultProps, useFoundation } from '../../base/index';
import { VirtualList, type VirtualListHandle, type VirtualListRowProps } from '../../internal/index';
import { useConfigContext } from '../config-provider/context';
import Input from '../input/index';
import useLocale from '../locale/use-locale';
import AutoSizer from './auto-sizer';
import { TreeContext, type TreeContextValue } from './context';
import type { TreeProps, FlattenNode, TreeNodeProps } from './interface';
import NodeList from './node-list';
import TreeNode from './tree-node';

type Foundation = TreeFoundation<React.MouseEvent>;
type Adapter = TreeAdapter<React.MouseEvent>;

export * from './interface';
export type { AutoSizerProps } from './auto-sizer';

const prefixcls = cssClasses.PREFIX;

const defaultProps = {
    showClear: true,
    disabled: false,
    blockNode: true,
    multiple: false,
    filterTreeNode: false,
    autoExpandParent: false,
    treeNodeFilterProp: 'label',
    defaultExpandAll: false,
    expandAll: false,
    onChangeWithObject: false,
    motion: true,
    leafOnly: false,
    showFilteredOnly: false,
    showLine: false,
    expandAction: false,
    disableStrictly: false,
    draggable: false,
    autoExpandWhenDragEnter: true,
    checkRelation: 'related',
    autoMergeValue: true,
} satisfies Partial<TreeProps>;

type RenderTreeNode = (treeNode: FlattenNode, ind?: number, style?: React.CSSProperties) => React.ReactNode;

interface VirtualRowData {
    flattenNodes: FlattenNode[];
    renderTreeNode: RenderTreeNode;
}

const NO_MOTION_KEYS: Set<string> = new Set();

// module level, so the rows stay mounted across renders; memo, so a scroll that renders only VirtualList skips the
// rows that stay in view (same data, cached style)
const VirtualRow = memo(function VirtualRow({ index, style, data }: VirtualListRowProps<VirtualRowData>) {
    return data.renderTreeNode(data.flattenNodes[index], index, style);
});

function getVirtualItemKey(index: number, data: VirtualRowData) {
    return data.flattenNodes[index].key;
}
function Tree(rawProps: TreeProps) {
    const props = useDefaultProps('Tree', rawProps, defaultProps);

    const {
        ref,
        autoExpandParent,
        autoExpandWhenDragEnter,
        blockNode,
        children,
        className,
        expandAll,
        defaultExpandAll,
        defaultExpandedKeys,
        defaultValue,
        directory,
        disabled,
        disableStrictly,
        draggable,
        emptyContent,
        expandAction,
        expandedKeys,
        filterTreeNode,
        hideDraggingNode,
        labelEllipsis,
        leafOnly,
        loadData,
        loadedKeys,
        motion,
        multiple,
        onChange,
        onChangeWithObject,
        onDoubleClick,
        onDragEnd,
        onDragEnter,
        onDragLeave,
        onDragOver,
        onDragStart,
        onDrop,
        onExpand,
        onLoad,
        onContextMenu,
        onSearch,
        onSelect,
        renderDraggingNode,
        renderFullLabel,
        renderLabel,
        classNames,
        styles,
        searchPlaceholder,
        searchRender,
        showClear,
        showFilteredOnly,
        showLine,
        style,
        treeData,
        treeDataSimpleJson,
        treeNodeFilterProp,
        value,
        virtualize,
        icon,
        checkRelation,
        keyMaps,
        autoMergeValue,
        expandIcon,
        // the tree's name and description go on the role="tree" element, not the wrapper
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        // the tree takes the Tab stop, so one injected by a wrapping Tooltip goes there too
        tabIndex = 0,
        ...rest
    } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('Tree');

    const listRef = useRef<VirtualListHandle>(null);

    // ref.scrollTo targets the foundation's rows; the list shows them only after the next commit when a search ran in
    // the same call, and later still while the keyword is deferred, so the request waits for the rows to match
    const scrollRequest = useRef<{ key: string; align: ScrollAlign } | null>(null);
    const renderedRows = useRef<BasicFlattenNode[] | null>(null);
    const treeRef = useRef<HTMLDivElement>(null);
    const treeId = useId();

    const listCls = clsx(`${prefixcls}-option-list`, { [`${prefixcls}-option-list-block`]: blockNode });

    const scrollWhenRendered = (liveRows: BasicFlattenNode[]) => {
        const request = scrollRequest.current;
        if (!request || renderedRows.current !== liveRows) {
            return;
        }
        scrollRequest.current = null;
        const index = liveRows.findIndex((node) => node.key === request.key);
        if (index !== -1) {
            listRef.current?.scrollToItem(index, request.align);
        }
    };

    const [foundation, state] = useFoundation<Foundation, Adapter, BasicTreeProps, BasicTreeInnerData>(
        TreeFoundation,
        props,
        () => TreeFoundation.getInitialState(props),
        (base) => ({
            notifyExpand: (expandedKeys, { expanded, node }) => base.getProps().onExpand?.(expandedKeys, { expanded, node }),
            notifySelect: (selectKey, bool, node) => base.getProps().onSelect?.(selectKey, bool, node),
            notifyChange: (value) => base.getProps().onChange?.(value),
            notifySearch: (input, filteredExpandedKeys) => base.getProps().onSearch?.(input, filteredExpandedKeys),
            notifyRightClick: (e, node) => base.getProps().onContextMenu?.(e, node),
            notifyDoubleClick: (e, node) => base.getProps().onDoubleClick?.(e, node),
            notifyLoad: (loadedKeys, treeNode) => base.getProps().onLoad?.(loadedKeys, treeNode),
            notifyDragStart: (props) => base.getProps().onDragStart?.(props),
            notifyDragEnter: (props) => base.getProps().onDragEnter?.(props),
            notifyDragOver: (props) => base.getProps().onDragOver?.(props),
            notifyDragLeave: (props) => base.getProps().onDragLeave?.(props),
            notifyDragEnd: (props) => base.getProps().onDragEnd?.(props),
            notifyDrop: (props) => base.getProps().onDrop?.(props),
            scrollToNode: (key, align) => {
                scrollRequest.current = { key, align };
                scrollWhenRendered(base.getState('flattenNodes'));
            },
            revealRow: (_index, key) => {
                if (listRef.current) {
                    // a deferred keyword renders the row at another index; shortcut: a row not rendered yet is not
                    // scrolled to, revisit if virtual-tree arrow keys get lost
                    const rendered = renderedRows.current?.findIndex((node) => node.key === key) ?? -1;
                    if (rendered !== -1) {
                        listRef.current.scrollToItem(rendered);
                    }
                } else {
                    // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
                    treeRef.current?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
                }
            },
        }),
        { direction }
    );

    // derived in render so new props reach the DOM in one commit; written back for the handlers, which settles
    const derived = TreeFoundation.deriveState(props, state);
    const liveView = derived ? { ...state, ...derived } : state;

    // only a keyword change is deferred; clicks, expansion, drag and arrow keys paint with the live state
    const deferredView = useDeferredValue(liveView);
    const view = deferredView.inputValue === liveView.inputValue ? liveView : deferredView;
    const { keyEntities, flattenNodes, inputValue, filteredKeys } = view;
    const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
    const noData = !keyEntities || Object.keys(keyEntities).length === 0 || (showFilteredOnly && searchNoRes);

    // keys act on the live rows, so Enter never picks a row the keyword already filtered out; the deferred list may
    // render the active row at another index, or not yet
    const activeIndex = TreeFoundation.getActiveIndex(liveView);
    const activeKey = liveView.flattenNodes[activeIndex]?.key;
    const renderedActiveIndex = view === liveView ? activeIndex : flattenNodes.findIndex((node) => node.key === activeKey);

    const contextValue: TreeContextValue = useMemo(
        () => ({
            treeDisabled: disabled,
            treeIcon: icon,
            onNodeExpand: foundation.handleNodeExpand,
            onNodeSelect: foundation.handleNodeSelect,
            onNodeCheck: foundation.handleNodeSelect,
            onNodeRightClick: foundation.handleNodeRightClick,
            onNodeDoubleClick: foundation.handleNodeDoubleClick,
            onNodeDragStart: foundation.handleNodeDragStart,
            onNodeDragEnter: foundation.handleNodeDragEnter,
            onNodeDragOver: foundation.handleNodeDragOver,
            onNodeDragLeave: foundation.handleNodeDragLeave,
            onNodeDragEnd: foundation.handleNodeDragEnd,
            onNodeDrop: foundation.handleNodeDrop,
            expandAction,
            directory,
            multiple,
            loadData,
            renderLabel,
            draggable,
            renderFullLabel,
            dragOverNodeKey: view.dragOverNodeKey,
            dropPosition: view.dropPosition,
            labelEllipsis: labelEllipsis === undefined ? virtualize : labelEllipsis,
        }),
        [disabled, icon, foundation, expandAction, directory, multiple, loadData, renderLabel, draggable, renderFullLabel, view.dragOverNodeKey, view.dropPosition, labelEllipsis, virtualize]
    );

    const getNodeProps = (treeNode: FlattenNode): TreeNodeProps | null => {
        const rowProps = buildRowProps(treeNode, view, props);
        // Node data may carry "empty", which TreeNode renders as the empty-content row
        return rowProps && ({ ...rowProps, empty: false } as TreeNodeProps);
    };

    const renderInput = () => {
        if (searchRender === false) {
            return null;
        }
        const inputProps = {
            value: liveView.inputValue,
            className: `${prefixcls}-input`,
            onChange: (input: string) => foundation.handleInputChange(input),
            prefix: <IconSearch />,
            showClear,
            placeholder: searchPlaceholder || locale?.searchPlaceholder,
        };
        return (
            <div className={clsx(`${prefixcls}-search-wrapper`, classNames?.search)} style={styles?.search}>
                {typeof searchRender === 'function' ? searchRender(inputProps) : <Input aria-label={locale.filter} addonAfter={null} addonBefore={null} insetLabel={null} suffix={null} {...inputProps} />}
            </div>
        );
    };

    const renderTreeNode: RenderTreeNode = (treeNode, _ind, nodeStyle) => {
        const nodeProps = getNodeProps(treeNode);
        if (!nodeProps) {
            return null;
        }
        // the jsx runtime wants key outside spread props
        const { key: nodeKey, ...restNodeProps } = nodeProps;
        return <TreeNode key={nodeKey} {...restNodeProps} id={nodeId(treeId, nodeKey)} style={nodeStyle} expandIcon={expandIcon} focused={nodeKey === activeKey} showLine={showLine} />;
    };

    const handleFocus = (event: React.FocusEvent<HTMLDivElement>) =>
        handleTreeFocusIn(event, () => {
            if (renderedActiveIndex !== -1) {
                listRef.current?.scrollToItem(renderedActiveIndex);
            }
        });

    const renderNodeList = () => {
        if (!flattenNodes?.length) {
            return undefined;
        }
        if (!virtualize || Object.keys(virtualize).length === 0) {
            return <NodeList flattenList={view.cachedFlattenNodes} flattenNodes={flattenNodes} motionKeys={motion ? view.motionKeys : NO_MOTION_KEYS} motionType={view.motionType} renderTreeNode={renderTreeNode} />;
        }
        return (
            <AutoSizer defaultHeight={virtualize.height} defaultWidth={virtualize.width}>
                {({ height, width }) => (
                    <VirtualList ref={listRef} className={`${prefixcls}-virtual-list`} style={{ direction }} tabIndex={-1} height={height as number} itemCount={flattenNodes.length} itemData={{ flattenNodes, renderTreeNode }} itemKey={getVirtualItemKey} itemSize={virtualize.itemSize} width={width}>
                        {VirtualRow}
                    </VirtualList>
                )}
            </AutoSizer>
        );
    };

    useLayoutEffect(() => {
        if (derived) {
            foundation.syncDerivedState(derived);
        }
    }, [derived, foundation]);

    // runs after the derived state is written back, so settled rows are the foundation's rows
    useLayoutEffect(() => {
        renderedRows.current = flattenNodes;
        scrollWhenRendered(foundation.getState('flattenNodes'));
    });

    useImperativeHandle(
        props.ref,
        () => ({
            search: (value: string) => foundation.handleInputChange(value),
            scrollTo: foundation.scrollTo,
        }),
        [foundation]
    );

    return (
        <TreeContext value={contextValue}>
            <div {...rest} className={clsx(`${prefixcls}-wrapper`, className)} style={style}>
                {filterTreeNode && renderInput()}
                {noData ? (
                    emptyContent !== null && (
                        <div className={listCls} role="none">
                            <TreeNode empty emptyContent={emptyContent || locale?.emptyText} />
                        </div>
                    )
                ) : (
                    <div
                        ref={treeRef}
                        className={listCls}
                        aria-activedescendant={renderedActiveIndex === -1 ? undefined : nodeId(treeId, activeKey)}
                        aria-describedby={ariaDescribedby}
                        aria-label={ariaLabel}
                        aria-labelledby={ariaLabelledby}
                        aria-multiselectable={Boolean(multiple)}
                        role="tree"
                        tabIndex={tabIndex}
                        onFocus={handleFocus}
                        onKeyDown={foundation.handleKeyDown}
                    >
                        {renderNodeList()}
                    </div>
                )}
            </div>
        </TreeContext>
    );
}

export default Tree;
