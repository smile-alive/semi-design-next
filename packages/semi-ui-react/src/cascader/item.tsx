import React, { cloneElement, isValidElement, type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/cascader/constants';
import CascaderFoundation, { type BasicCascaderData, type BasicEntity, type ShowNextType, type BasicData, type Virtualize } from '@fibrae/semi-foundation/cascader/foundation';
import { highlightParts } from '@fibrae/semi-foundation/cascader/util';
import { IconChevronRight, IconTick } from '@fibrae/semi-icons-react';
import VirtualList, { type VirtualListHandle } from '../_base/virtual-list';
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

/** The inner element of the virtual search list: the rows are its `li` children */
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

    const onClick = (e: React.MouseEvent, item: Entity | Data) => {
        if (item.data.disabled || ('disabled' in item && item.disabled)) {
            return;
        }
        onItemClick(e, item);
    };

    const onHover = (e: React.MouseEvent, item: Entity) => {
        if (item.data.disabled) {
            return;
        }
        if (showNext === strings.SHOW_NEXT_BY_HOVER) {
            onItemHover(e, item);
        }
    };

    const onCheckboxChange = (e: CheckboxEvent, item: Entity | Data) => {
        e.stopPropagation();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
        onItemCheckboxClick(item);
    };

    const renderIcon = (type: string, haveMarginLeft = false) => {
        const finalCls = (style: string) => {
            return style + (haveMarginLeft ? ` ${prefixcls}-icon-left` : '');
        };
        switch (type) {
            case 'child':
                if (expandIcon) {
                    return expandIcon;
                }
                return <IconChevronRight className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-expand`)} />;
            case 'tick':
                return <IconTick className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-active`)} />;
            case 'loading':
                // the option carries the state as aria-busy; the spinner's own name would join the option's name
                return (
                    <span aria-hidden>
                        <Spin wrapperClassName={finalCls(`${prefixcls}-spin-icon`)} />
                    </span>
                );
            case 'empty':
                return <span className={finalCls(`${prefixcls}-icon ${prefixcls}-icon-empty`)} aria-hidden />;
            default:
                return null;
        }
    };

    const renderFlattenOptionItem = (item: Data, _index?: number, style?: React.CSSProperties) => {
        const { searchText, key, disabled, pathData } = item;
        const selected = selectedKeys.has(key);
        const className = clsx(prefixcls, {
            [`${prefixcls}-flatten`]: !filterRender,
            [`${prefixcls}-disabled`]: disabled,
            [`${prefixcls}-select`]: selected && !multiple,
            [`${prefixcls}-focused`]: key === keyboardKey,
        });
        const onItemClickInList = (e: React.MouseEvent) => {
            onClick(e, item);
        };
        const onCheck = (e: CheckboxEvent) => onCheckboxChange(e, item);
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
    const renderItem = (renderData: Array<Entity>, content: Array<React.ReactNode> = []) => {
        const showChildItem = renderData.find((item) => activeKeys.has(item.key) && item.data.children?.length);
        const ind = content.length;
        content.push(
            <ul key={renderData[0].key} className={`${prefixcls}-list`} role="none" onScroll={(e) => onListScroll(e, ind)}>
                {renderData.map((item, index) => {
                    const { key } = item;
                    const { label, disabled } = item.data;
                    const showExpand = CascaderFoundation.isBranch(item.data, loadData);
                    const { selected, loading, showActive, showSelected, aria } = CascaderFoundation.getTreeItemState(key, { activeKeys, selectedKeys, loadedKeys, loadingKeys, checkedKeys, halfCheckedKeys }, multiple, showExpand);
                    const className = clsx(prefixcls, {
                        [`${prefixcls}-active`]: showActive,
                        [`${prefixcls}-select`]: showSelected,
                        [`${prefixcls}-disabled`]: disabled,
                        [`${prefixcls}-focused`]: key === keyboardKey,
                    });
                    return (
                        <li
                            key={key}
                            id={optionId(key)}
                            className={className}
                            {...aria}
                            aria-disabled={disabled || undefined}
                            aria-level={ind + 1}
                            aria-posinset={index + 1}
                            aria-setsize={renderData.length}
                            role="treeitem"
                            onClick={(e) => {
                                onClick(e, item);
                            }}
                            onMouseEnter={(e) => {
                                onHover(e, item);
                            }}
                        >
                            <span className={`${prefixcls}-label`}>
                                {selected && !multiple && renderIcon('tick')}
                                {!selected && !multiple && renderIcon('empty')}
                                {multiple && <Checkbox className={`${prefixcls}-label-checkbox`} aria-hidden tabIndex={-1} checked={checkedKeys.has(item.key)} disabled={disabled} indeterminate={halfCheckedKeys.has(item.key)} onChange={(e: CheckboxEvent) => onCheckboxChange(e, item)} />}
                                <span>{label}</span>
                            </span>
                            {showExpand && renderIcon(loading ? 'loading' : 'child', true)}
                        </li>
                    );
                })}
            </ul>
        );
        if (showChildItem) {
            return renderItem(showChildItem.children, content);
        }
        return content;
    };

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
            {searchable ? renderFlattenOption(data as Data[]) : renderItem(data as Entity[])}
        </div>
    );
}
