import { type JSX, Index, Match, Show, Switch, children, createMemo, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import { getTreeLabelClassMap, getTreeRowAria, getTreeRowClassMap, isTreeNodeLeaf, type TreeRowFlags } from '@fibrae/semi-foundation/tree/shared';
import { IconFile, IconFolder, IconFolderOpen } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import Checkbox from '../checkbox';
import Highlight from '../highlight';
import { useTreeContext } from './context';
import type { RenderFullLabelProps, TreeNodeProps, TreeRowProps } from './interface';
import NodeArrow from './node-arrow';

const prefix = cssClasses.PREFIX_OPTION;

/**
 * One row of the tree. The row takes no focus: the tree keeps it and points at the row with aria-activedescendant
 * (`id`, `focused`), so the keys are handled by the tree, and the arrow and the checkbox inside are only pictures of
 * the row's state. Every interaction reports the whole `row` to the tree through the context.
 */
export default function TreeNode(props: TreeNodeProps) {
    const context = useTreeContext('Tree.Node');

    // a double-click expands, so a click within 500ms of the previous one does not select again (a leading-edge
    // debounce, as React's row does)
    let lastClick = Number.NEGATIVE_INFINITY;

    const view = context.view;

    // renderLabel runs again only when one of its arguments changes, not on every change of the row's state
    const label = createMemo(() => props.row.label);
    const data = createMemo(() => props.row.data);
    const keyword = createMemo(() => props.row.keyword);

    // same rule as the foundation's #isDisabled: a disabled tree wins over a node's own disabled: false
    const disabled = () => Boolean(view().treeDisabled || props.row.disabled);

    const isLeaf = () => isTreeNodeLeaf(props.row, view().hasLoadData);

    const rowFlags = (): TreeRowFlags => {
        const { draggable, labelEllipsis, renderFullLabel, dragOverNodeKey, dropPosition } = view();
        return { disabled: disabled(), focused: props.focused, draggable, labelEllipsis, fullLabel: Boolean(renderFullLabel), dragOverNodeKey, dropPosition };
    };

    const nodeClass = () => clsx(getTreeRowClassMap(props.row, rowFlags()));

    const labelClass = () => clsx(getTreeLabelClassMap(props.row, rowFlags()));

    const highlighted = () => {
        const value = label();
        return (typeof value === 'string' || typeof value === 'number') && props.row.filtered && Boolean(keyword());
    };

    // created by the row that inserts it, so a renderFullLabel row never reads the tree's icon
    const RowIcon = () => {
        // children() resolves only zero-argument functions, so a render function comes through as itself
        const icon = children(() => context.icon?.() as JSX.Element);
        const iconFunction = () => {
            const value = icon();
            return typeof value === 'function' ? (value as (row: TreeRowProps) => JSX.Element) : undefined;
        };
        return (
            <Switch
                fallback={
                    <Show when={view().directory}>
                        <Switch fallback={<IconFolder class={`${prefix}-item-icon`} />}>
                            <Match when={isLeaf()}>
                                <IconFile class={`${prefix}-item-icon`} />
                            </Match>
                            <Match when={props.row.expanded}>
                                <IconFolderOpen class={`${prefix}-item-icon`} />
                            </Match>
                        </Switch>
                    </Show>
                }
            >
                <Match keyed when={iconFunction()}>
                    {(render) => <>{render(props.row)}</>}
                </Match>
                <Match when={hasContent(icon())}>{icon()}</Match>
            </Switch>
        );
    };

    const onSelect = (e: MouseEvent) => context.onNodeSelect(e, props.row);

    const onExpand = (e: MouseEvent) => {
        e.stopPropagation();
        context.onNodeExpand(e, props.row);
    };

    const onCheck = (e: MouseEvent) => {
        if (disabled()) {
            return;
        }
        e.stopPropagation();
        context.onNodeCheck(e, props.row);
    };

    const onContextMenu = (e: MouseEvent) => context.onNodeRightClick?.(e, props.row);

    const onClick = (e: MouseEvent) => {
        if (view().expandAction === 'doubleClick') {
            const now = Date.now();
            const idle = now - lastClick >= 500;
            lastClick = now;
            if (idle) {
                onSelect(e);
            }
            return;
        }
        onSelect(e);
        if (view().expandAction === 'click') {
            onExpand(e);
        }
    };

    const onDoubleClick = (e: MouseEvent) => {
        e.stopPropagation();
        context.onNodeDoubleClick?.(e, props.row);
        if (view().expandAction === 'doubleClick') {
            onExpand(e);
        }
    };

    // the foundation reads the row element from nodeInstance, to place the drop and to build the drag image
    const withInstance = (e: DragEvent): TreeRowProps => ({ ...props.row, nodeInstance: e.currentTarget });

    const onDragStart = (e: DragEvent) => {
        e.stopPropagation();
        context.onNodeDragStart?.(e, withInstance(e));
    };

    const onDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDragEnter?.(e, withInstance(e));
    };

    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDragOver?.(e, withInstance(e));
    };

    const onDragLeave = (e: DragEvent) => {
        e.stopPropagation();
        context.onNodeDragLeave?.(e, withInstance(e));
    };

    const onDragEnd = (e: DragEvent) => {
        e.stopPropagation();
        context.onNodeDragEnd?.(e, withInstance(e));
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDrop?.(e, withInstance(e));
    };

    const rowAttrs = (): JSX.LiHTMLAttributes<HTMLLIElement> & { 'data-key': string } => {
        const { row } = props;
        const { multiple, draggable } = view();
        return {
            id: props.id,
            ...getTreeRowAria(row, { disabled: disabled(), isLeaf: isLeaf(), multiple }),
            'data-key': row.eventKey,
            ...(draggable ? { draggable: !disabled() || undefined, onDragStart, onDragEnter, onDragOver, onDragLeave, onDrop, onDragEnd } : {}),
        };
    };

    // a live object: renderFullLabel runs once, and its JSX reads these getters
    const createFullLabelProps = (): RenderFullLabelProps => ({
        get data() {
            return data();
        },
        get level() {
            return props.row.level;
        },
        get class() {
            return nodeClass();
        },
        expandIcon: () => <NodeArrow expandIcon={props.expandIcon} row={props.row} showLine={props.showLine} onExpand={onExpand} />,
        get checkStatus() {
            return { checked: Boolean(props.row.checked), halfChecked: Boolean(props.row.halfChecked) };
        },
        get expandStatus() {
            return { expanded: Boolean(props.row.expanded), loading: Boolean(props.row.loading) };
        },
        get filtered() {
            return props.row.filtered;
        },
        get searchWord() {
            return keyword();
        },
        onClick,
        onCheck,
        onExpand,
        onContextMenu,
        onDoubleClick,
    });

    return (
        <Show
            keyed
            when={view().renderFullLabel}
            fallback={
                <li {...rowAttrs()} class={nodeClass()} role="treeitem" style={props.style} onClick={onClick} onContextMenu={onContextMenu} onDblClick={onDoubleClick}>
                    <span class={clsx(`${prefix}-indent`, { [`${prefix}-indent-show-line`]: props.showLine })} aria-hidden="true">
                        <Index each={Array.from({ length: props.row.level }, (_, i) => props.row.isEnd[i])}>{(end) => <span class={clsx(`${prefix}-indent-unit`, { [`${prefix}-indent-unit-end`]: end() })} />}</Index>
                    </span>
                    <NodeArrow expandIcon={props.expandIcon} row={props.row} showLine={props.showLine} onExpand={onExpand} />
                    <span class={labelClass()}>
                        <Show when={view().multiple}>
                            <div aria-hidden="true" onClick={onCheck}>
                                <Checkbox checked={Boolean(props.row.checked)} disabled={disabled()} indeterminate={Boolean(props.row.halfChecked)} tabIndex={-1} />
                            </div>
                        </Show>
                        <RowIcon />
                        <span class={`${prefix}-label-text`}>
                            <Switch fallback={label()}>
                                <Match keyed when={view().renderLabel}>
                                    {(render) => <>{render(label(), data(), keyword())}</>}
                                </Match>
                                <Match when={highlighted()}>
                                    <Highlight component="span" highlightClassName={`${prefix}-highlight`} searchWords={[keyword()]} sourceString={String(label())} />
                                </Match>
                            </Switch>
                        </span>
                    </span>
                </li>
            }
        >
            {(render) => (
                <li {...rowAttrs()} role="treeitem" style={props.style}>
                    {/* called once: the live props update the returned JSX in place */}
                    {untrack(() => render(createFullLabelProps()))}
                </li>
            )}
        </Show>
    );
}
