import React, { memo, useEffect, useState } from 'react';
import clsx from 'clsx';
import { debounce } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import { getTreeLabelClassMap, getTreeRowAria, getTreeRowClassMap, isTreeNodeLeaf } from '@fibrae/semi-foundation/tree/shared';
import { IconTreeTriangleDown, IconFile, IconFolder, IconFolderOpen } from '@fibrae/semi-icons-react';
import { Checkbox } from '../checkbox';
import Highlight from '../highlight';
import Spin from '../spin';
import Indent from './indent';
import type { TreeNodeProps } from './interface';
import { useTreeContext } from './tree-context';

const prefixcls = cssClasses.PREFIX_OPTION;

function isEmptyStyle(style: React.CSSProperties) {
    return !style || Object.keys(style).length === 0;
}

/**
 * One row of the tree. Callbacks pass the whole props object to the tree's handlers.
 * The row takes no focus: the tree keeps it and points at the row with aria-activedescendant (`id`, `focused`).
 */
function TreeNode(props: TreeNodeProps): React.ReactNode {
    const { id, focused, eventKey, expanded, checked, halfChecked, loading, level, empty, emptyContent, filtered, style, isEnd, showLine, expandIcon, disabled: disabledProp, icon, label, keyword, data } = props;

    const context = useTreeContext('Tree.Node');

    // a double-click expands, so clicks right after the first do not select again
    const [debouncedSelect] = useState(() => debounce((select: () => void) => select(), 500, { edges: ['leading'] }));

    useEffect(() => () => debouncedSelect.cancel(), [debouncedSelect]);

    if (empty) {
        return (
            <ul className={clsx(prefixcls, `${prefixcls}-empty`)}>
                <li className={`${prefixcls}-label ${prefixcls}-label-empty`} x-semi-prop="emptyContent">
                    {emptyContent}
                </li>
            </ul>
        );
    }

    const { multiple, draggable, renderFullLabel, dragOverNodeKey, dropPosition, labelEllipsis, loadData, treeDisabled, treeIcon, directory, renderLabel, expandAction } = context;
    const isLeaf = isTreeNodeLeaf(props, loadData);
    const disabled = Boolean(treeDisabled || disabledProp);
    const rowFlags = { disabled, focused, draggable, labelEllipsis: Boolean(labelEllipsis), fullLabel: Boolean(renderFullLabel), dragOverNodeKey, dropPosition };
    const nodeCls = clsx(getTreeRowClassMap(props, rowFlags));
    const rowAria = { id, ...getTreeRowAria(props, { disabled, isLeaf, multiple }) };

    const onSelect = (e: React.MouseEvent | React.KeyboardEvent) => context.onNodeSelect(e, props);

    const onExpand = (e: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        e?.nativeEvent?.stopImmediatePropagation();
        context.onNodeExpand(e, props);
    };

    const onCheck = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (disabled) {
            return;
        }
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
        context.onNodeCheck(e, props);
    };

    const onContextMenu = (e: React.MouseEvent) => context.onNodeRightClick(e, props);

    const onClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (expandAction === 'doubleClick') {
            debouncedSelect(() => onSelect(e));
            return;
        }
        onSelect(e);
        if (expandAction === 'click') {
            onExpand(e);
        }
    };

    const onDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if (typeof context.onNodeDoubleClick === 'function') {
            context.onNodeDoubleClick(e, props);
        }
        if (expandAction === 'doubleClick') {
            onExpand(e);
        }
    };

    // the drag handlers sit on the row element, which a custom full label renders itself
    const withInstance = (e: React.DragEvent<HTMLElement>) => ({ ...props, nodeInstance: e.currentTarget });

    const onDragStart = (e: React.DragEvent<HTMLLIElement>) => {
        e.stopPropagation();
        context.onNodeDragStart(e, withInstance(e));
    };

    const onDragEnter = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDragEnter(e, withInstance(e));
    };

    const onDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDragOver(e, withInstance(e));
    };

    const onDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.stopPropagation();
        context.onNodeDragLeave(e, withInstance(e));
    };

    const onDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.stopPropagation();
        context.onNodeDragEnd(e, withInstance(e));
    };

    const onDrop = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.stopPropagation();
        context.onNodeDrop(e, withInstance(e));
    };

    const dragProps = {
        onDoubleClick,
        onDragStart: draggable ? onDragStart : undefined,
        onDragEnter: draggable ? onDragEnter : undefined,
        onDragOver: draggable ? onDragOver : undefined,
        onDragLeave: draggable ? onDragLeave : undefined,
        onDrop: draggable ? onDrop : undefined,
        onDragEnd: draggable ? onDragEnd : undefined,
        draggable: (!disabled && draggable) || undefined,
    };

    const renderArrow = () => {
        if (loading) {
            // the row carries aria-busy; the spinner's own name would join the row's name
            return <Spin wrapperClassName={`${prefixcls}-spin-icon`} aria-hidden />;
        }
        if (!isLeaf) {
            if (expandIcon) {
                if (typeof expandIcon === 'function') {
                    return expandIcon({ onClick: onExpand, className: `${prefixcls}-expand-icon`, expanded });
                }
                if (React.isValidElement<{ className?: string; onClick?: typeof onExpand }>(expandIcon)) {
                    return React.cloneElement(expandIcon, {
                        onClick: onExpand,
                        className: clsx(`${prefixcls}-expand-icon`, expandIcon.props.className),
                    });
                }
                return expandIcon;
            }
            return <IconTreeTriangleDown className={`${prefixcls}-expand-icon`} size="small" onClick={onExpand} />;
        }
        if (showLine) {
            return (
                <span className={`${prefixcls}-switcher`}>
                    <span className={`${prefixcls}-switcher-leaf-line`} />
                </span>
            );
        }
        return <span className={`${prefixcls}-empty-icon`} />;
    };

    const renderIcon = () => {
        if (icon) {
            return icon;
        }
        if (treeIcon) {
            return typeof treeIcon === 'function' ? treeIcon(props) : treeIcon;
        }
        if (directory) {
            if (isLeaf) {
                return <IconFile className={`${prefixcls}-item-icon`} />;
            }
            return expanded ? <IconFolderOpen className={`${prefixcls}-item-icon`} /> : <IconFolder className={`${prefixcls}-item-icon`} />;
        }
        return null;
    };

    const renderRealLabel = () => {
        if (typeof renderLabel === 'function') {
            return renderLabel(label, data, keyword);
        }
        if ((typeof label === 'string' || typeof label === 'number') && filtered && keyword) {
            return <Highlight component="span" highlightClassName={`${prefixcls}-highlight`} searchWords={[keyword]} sourceString={String(label)} />;
        }
        return label;
    };

    if (renderFullLabel) {
        const customLabel = renderFullLabel({
            onClick,
            onContextMenu,
            onDoubleClick,
            className: nodeCls,
            onExpand,
            data,
            level,
            onCheck,
            style,
            expandIcon: renderArrow(),
            checkStatus: { checked, halfChecked },
            expandStatus: { expanded, loading },
            filtered,
            searchWord: keyword,
        });
        // text, arrays and fragments cannot carry the treeitem attributes, so an li wraps them
        if (!React.isValidElement<{ style?: React.CSSProperties }>(customLabel) || customLabel.type === React.Fragment) {
            return (
                <li style={style} {...rowAria} role="treeitem" {...dragProps}>
                    {customLabel}
                </li>
            );
        }
        const customRowProps = { role: 'treeitem', ...rowAria };
        if (draggable) {
            return React.cloneElement(customLabel, {
                ...customRowProps,
                ...dragProps,
            } as React.Attributes);
        }
        // in virtualization, style holds the row position
        return isEmptyStyle(style)
            ? React.cloneElement(customLabel, customRowProps as React.Attributes)
            : React.cloneElement(customLabel, {
                  ...customRowProps,
                  style: { ...customLabel.props.style, ...style },
              } as React.Attributes);
    }

    const labelCls = clsx(getTreeLabelClassMap(props, rowFlags));

    return (
        <li className={nodeCls} style={style} data-key={eventKey} {...rowAria} role="treeitem" onClick={onClick} onContextMenu={onContextMenu} {...dragProps}>
            <Indent isEnd={isEnd} level={level} prefixcls={prefixcls} showLine={showLine} />
            {renderArrow()}
            <span className={labelCls}>
                {multiple && (
                    <div role="none" onClick={onCheck}>
                        <Checkbox aria-hidden tabIndex={-1} checked={checked} disabled={disabled} indeterminate={halfChecked} />
                    </div>
                )}
                {renderIcon()}
                <span className={`${prefixcls}-label-text`}>{renderRealLabel()}</span>
            </span>
        </li>
    );
}

export default memo(TreeNode);
