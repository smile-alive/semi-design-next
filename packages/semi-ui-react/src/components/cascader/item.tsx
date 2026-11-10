import React, { cloneElement, isValidElement, memo, type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/components/cascader/constants';
import CascaderFoundation, { type BasicCascaderData, type BasicEntity, type ShowNextType, type BasicData, type Virtualize } from '@fibrae/semi-foundation/components/cascader/foundation';
import { getColumns, highlightParts } from '@fibrae/semi-foundation/components/cascader/util';
import { IconChevronRight, IconTick } from '@fibrae/semi-icons-react';
import VirtualList, { type VirtualListHandle } from '../../internal/virtual-list';
import Checkbox, { type CheckboxEvent } from '../checkbox';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import VirtualRow from '../select/virtual-row';
import Spin from '../spin';

export interface CascaderData extends BasicCascaderData {
    label: React.ReactNode;
}

export interface Entity extends BasicEntity {
    children?: Array<Entity>;
    data: CascaderData;
    parent?: Entity;
}

export interface Entities {
    [idx: string]: Entity;
}

export interface Data extends BasicData {
    data: CascaderData;
    searchText: React.ReactNode[];
}

export interface FilterRenderProps {
    className: string;
    inputValue: string;
    disabled: boolean;
    data: CascaderData[];
    checkStatus: {
        checked: boolean;
        halfChecked: boolean;
    };
    selected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onCheck: (e: CheckboxEvent) => void;
}

export interface CascaderItemProps {
    activeKeys: Set<string>;
    selectedKeys: Set<string>;
    loadedKeys: Set<string>;
    loadingKeys: Set<string>;
    onItemClick: (e: React.MouseEvent | React.KeyboardEvent, item: Entity | Data) => void;
    onItemHover: (e: React.MouseEvent, item: Entity) => void;
    showNext: ShowNextType;
    onItemCheckboxClick: (item: Entity | Data) => void;
    onListScroll: (e: React.UIEvent<HTMLUListElement>, ind: number) => void;
    searchable: boolean;
    keyword: string;
    emptyContent: React.ReactNode;
    loadData: (selectOptions: CascaderData[]) => Promise<void>;
    data: Array<Data | Entity>;
    separator: string;
    multiple: boolean;
    checkedKeys: Set<string>;
    halfCheckedKeys: Set<string>;
    filterRender?: (props: FilterRenderProps) => ReactNode;
    virtualize?: Virtualize;
    expandIcon?: ReactNode;
    /** id of the tree, or of the listbox of search results; the combobox's aria-controls points at it */
    id: string;
    /** the popup's name, the same as the combobox's */
    labelProps: Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby'>;
    /** the option the arrow keys are on, pointed at by the combobox's aria-activedescendant */
    keyboardKey: string | null;
    optionId: (key: string) => string;
    virtualListRef: React.Ref<VirtualListHandle>;
}

const prefixcls = cssClasses.PREFIX_OPTION;

function VirtualListInner(props: React.ComponentProps<'ul'>) {
    return <ul {...props} className={`${prefixcls}-list`} role="none" />;
}

function highlight(searchText: React.ReactNode[], keyword: string, separator: string) {
    return highlightParts(searchText, keyword, separator).map((part, index) =>
        part.match ? (
            <span key={index} className={`${prefixcls}-label-highlight`}>
                {part.text}
            </span>
        ) : (
            part.text
        )
    );
}

function renderIcon(type: 'child' | 'tick' | 'loading' | 'empty', expandIcon?: ReactNode, haveMarginLeft = false) {
    const finalCls = (style: string) => style + (haveMarginLeft ? ` ${prefixcls}-icon-left` : '');
    switch (type) {
        case 'child':
            return expandIcon || <IconChevronRight className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-expand`)} />;
        case 'tick':
            return <IconTick className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-active`)} />;
        case 'loading':
            // the option carries the state as aria-busy; the spinner's own name would join the option's name
            return (
                <span aria-hidden>
                    <Spin wrapperClassName={finalCls(`${prefixcls}-spin-icon`)} />
                </span>
            );
        default:
            return <span className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-empty`)} aria-hidden />;
    }
}

function clickItem(e: React.MouseEvent, item: Entity | Data, onItemClick: CascaderItemProps['onItemClick']) {
    if (item.data.disabled || ('disabled' in item && item.disabled)) {
        return;
    }
    onItemClick(e, item);
}

function checkItem(e: CheckboxEvent, item: Entity | Data, onItemCheckboxClick: CascaderItemProps['onItemCheckboxClick']) {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
    onItemCheckboxClick(item);
}

type TreeItemAria = ReturnType<typeof CascaderFoundation.getTreeItemState>['aria'];

interface TreeOptionProps extends TreeItemAria, Pick<CascaderItemProps, 'multiple' | 'showNext' | 'expandIcon' | 'onItemClick' | 'onItemHover' | 'onItemCheckboxClick'> {
    id: string;
    item: Entity;
    level: number;
    posinset: number;
    setsize: number;
    expandable: boolean;
    selected: boolean;
    loading: boolean;
    showActive: boolean;
    showSelected: boolean;
    focused: boolean;
    checked: boolean;
    halfChecked: boolean;
}

// Every prop is a primitive, the entity or a stable handler: hover and arrow keys re-render only the rows they change
const TreeOption = memo(function TreeOption({ id, item, level, posinset, setsize, expandable, selected, loading, showActive, showSelected, focused, checked, halfChecked, multiple, showNext, expandIcon, onItemClick, onItemHover, onItemCheckboxClick, ...aria }: TreeOptionProps) {
    const { label, disabled } = item.data;
    const className = clsx(prefixcls, {
        [`${prefixcls}-active`]: showActive,
        [`${prefixcls}-select`]: showSelected,
        [`${prefixcls}-disabled`]: disabled,
        [`${prefixcls}-focused`]: focused,
    });
    return (
        <li
            id={id}
            className={className}
            {...aria}
            aria-disabled={disabled || undefined}
            aria-level={level}
            aria-posinset={posinset}
            aria-setsize={setsize}
            role="treeitem"
            onClick={(e) => clickItem(e, item, onItemClick)}
            onMouseEnter={(e) => {
                if (!disabled && showNext === strings.SHOW_NEXT_BY_HOVER) {
                    onItemHover(e, item);
                }
            }}
        >
            <span className={`${prefixcls}-label`}>
                {selected && !multiple && renderIcon('tick')}
                {!selected && !multiple && renderIcon('empty')}
                {multiple && <Checkbox className={`${prefixcls}-label-checkbox`} aria-hidden tabIndex={-1} checked={checked} disabled={disabled} indeterminate={halfChecked} onChange={(e: CheckboxEvent) => checkItem(e, item, onItemCheckboxClick)} />}
                <span>{label}</span>
            </span>
            {expandable && renderIcon(loading ? 'loading' : 'child', expandIcon, true)}
        </li>
    );
});

export default function Item({
    activeKeys,
    selectedKeys,
    loadedKeys,
    loadingKeys,
    onItemClick,
    onItemHover,
    showNext,
    onItemCheckboxClick,
    onListScroll,
    searchable,
    keyword,
    emptyContent,
    loadData,
    data,
    separator,
    multiple,
    checkedKeys,
    halfCheckedKeys,
    filterRender,
    virtualize,
    expandIcon,
    id,
    labelProps,
    keyboardKey,
    optionId,
    virtualListRef,
}: CascaderItemProps) {
    const { direction } = useConfigContext();
    const { locale } = useLocale('Cascader');

    const isEmpty = !data || !data.length;

    const listsCls = clsx({
        [`${prefixcls}-lists`]: true,
        [`${prefixcls}-lists-empty`]: isEmpty,
    });

    const renderFlattenOptionItem = (item: Data, _index?: number, style?: React.CSSProperties) => {
        const { searchText, key, disabled, pathData } = item;
        const selected = selectedKeys.has(key);
        const className = clsx(prefixcls, {
            [`${prefixcls}-flatten`]: !filterRender,
            [`${prefixcls}-disabled`]: disabled,
            [`${prefixcls}-select`]: selected && !multiple,
            [`${prefixcls}-focused`]: key === keyboardKey,
        });
        const onItemClickInList = (e: React.MouseEvent) => clickItem(e, item, onItemClick);
        const onCheck = (e: CheckboxEvent) => checkItem(e, item, onItemCheckboxClick);
        const optionAria = {
            id: optionId(key),
            role: 'option',
            'aria-disabled': disabled || undefined,
            'aria-selected': multiple ? checkedKeys.has(key) : selected,
        };
        if (filterRender) {
            const renderProps = {
                className,
                inputValue: keyword,
                disabled,
                data: pathData,
                checkStatus: {
                    checked: checkedKeys.has(item.key),
                    halfChecked: halfCheckedKeys.has(item.key),
                },
                selected,
                onClick: onItemClickInList,
                onCheck,
            };
            const rendered = filterRender(renderProps);
            if (!isValidElement<{ style?: React.CSSProperties }>(rendered)) {
                // text, null or an array has no element to carry the option props, so an li carries them
                return (
                    <li key={key} id={optionAria.id} className={className} style={style} aria-disabled={optionAria['aria-disabled']} aria-selected={optionAria['aria-selected']} role="option" onClick={onItemClickInList}>
                        {rendered}
                    </li>
                );
            }
            const otherProps = virtualize
                ? {
                      key,
                      style: {
                          ...rendered.props.style,
                          ...style,
                      },
                  }
                : { key };
            return cloneElement(rendered, { ...otherProps, ...optionAria });
        }
        return (
            <li key={key} id={optionAria.id} className={className} style={style} aria-disabled={optionAria['aria-disabled']} aria-selected={optionAria['aria-selected']} role="option" onClick={onItemClickInList}>
                <span className={`${prefixcls}-label`}>
                    {!multiple && renderIcon('empty')}
                    {multiple && <Checkbox className={`${prefixcls}-label-checkbox`} aria-hidden tabIndex={-1} checked={checkedKeys.has(item.key)} disabled={disabled} indeterminate={halfCheckedKeys.has(item.key)} onChange={onCheck} />}
                    {highlight(searchText, keyword, separator)}
                </span>
            </li>
        );
    };

    const renderFlattenOption = (options: Data[]) =>
        virtualize ? (
            <VirtualList
                key="flatten-list"
                ref={virtualListRef}
                style={{ direction }}
                tabIndex={-1}
                // Only a pixel height is usable: the visible rows are computed from it
                height={virtualize.height ?? numbers.LIST_HEIGHT}
                innerElementType={VirtualListInner}
                itemCount={options.length}
                itemData={{ visibleOptions: options, renderOption: renderFlattenOptionItem }}
                itemSize={virtualize.itemSize}
                width={virtualize.width ?? '100%'}
            >
                {VirtualRow}
            </VirtualList>
        ) : (
            <ul key="flatten-list" className={`${prefixcls}-list`} role="none">
                {options.map((option) => renderFlattenOptionItem(option))}
            </ul>
        );

    /**
     * One list per level of the active path, together one flat tree: aria-level, aria-setsize and aria-posinset carry
     * the hierarchy. Owning the next list as a group (aria-owns) would make it part of the branch's name.
     */
    const renderTree = (topLevel: Entity[]) =>
        getColumns(topLevel, activeKeys).map(({ items, level }) => (
            <ul key={items[0].key} className={`${prefixcls}-list`} role="none" onScroll={(e) => onListScroll(e, level)}>
                {items.map((item, index) => {
                    const { key } = item;
                    const expandable = CascaderFoundation.isBranch(item.data, loadData);
                    const { selected, loading, showActive, showSelected, aria } = CascaderFoundation.getTreeItemState(key, { activeKeys, selectedKeys, loadedKeys, loadingKeys, checkedKeys, halfCheckedKeys }, multiple, expandable);
                    return (
                        <TreeOption
                            key={key}
                            id={optionId(key)}
                            {...aria}
                            checked={checkedKeys.has(key)}
                            multiple={multiple}
                            expandable={expandable}
                            expandIcon={expandIcon}
                            focused={key === keyboardKey}
                            halfChecked={halfCheckedKeys.has(key)}
                            item={item}
                            level={level + 1}
                            loading={loading}
                            posinset={index + 1}
                            selected={selected}
                            setsize={items.length}
                            showActive={showActive}
                            showNext={showNext}
                            showSelected={showSelected}
                            onItemCheckboxClick={onItemCheckboxClick}
                            onItemClick={onItemClick}
                            onItemHover={onItemHover}
                        />
                    );
                })}
            </ul>
        ));

    const renderEmpty = () => {
        if (emptyContent === null) {
            return null;
        }
        return (
            <div className={`${prefixcls} ${prefixcls}-empty`}>
                <span className={`${prefixcls}-label`} x-semi-prop="emptyContent">
                    {emptyContent || locale.emptyText}
                </span>
            </div>
        );
    };

    if (isEmpty) {
        // the id stays for the combobox's aria-controls; with nothing to choose there is no tree or listbox
        return (
            <div id={id} className={listsCls}>
                {renderEmpty()}
            </div>
        );
    }

    return (
        <div id={id} className={listsCls} aria-multiselectable={multiple || undefined} role={searchable ? 'listbox' : 'tree'} {...labelProps}>
            {searchable ? renderFlattenOption(data as Data[]) : renderTree(data as Entity[])}
        </div>
    );
}
