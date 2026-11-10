import type React from 'react';
import { Fragment, Suspense, lazy, useCallback, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/transfer/constants';
import TransferFoundation, { type TransferAdapter, type BasicDataItem, type OnSortEndProps } from '@fibrae/semi-foundation/components/transfer/foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/transfer/transfer.scss';
import { IconClose, IconSearch, IconHandle } from '@fibrae/semi-icons-react';
import { type ElementProps, createContext, useDefaultProps, useFoundation } from '../../base/index';
import { useIsServerRender } from '../../hooks/index';
import { VirtualList, type VirtualListRowProps } from '../../internal/index';
import type { RenderItemProps } from '../../internal/sortable';
import type { SortableHandle } from '../../internal/sortable/types';
import Button from '../button';
import { Checkbox } from '../checkbox/index';
import Input, { type InputProps } from '../input/index';
import useLocale from '../locale/use-locale';
import Pagination from '../pagination';
import Spin from '../spin';
import Tree from '../tree';
import AutoSizer from '../tree/auto-sizer';
import type { Value as TreeValue, TreeProps, TreeHandle } from '../tree/interface';

type Foundation = TransferFoundation<TransferProps, React.FocusEvent<HTMLDivElement>>;
type Adapter = TransferAdapter<TransferProps, React.FocusEvent<HTMLDivElement>>;

const SortableList = lazy(() => import('../../internal/sortable').then((module) => ({ default: module.Sortable })));

export interface DataItem extends BasicDataItem {
    label?: React.ReactNode;
    fullPath?: Array<FullPathItem>;
}

export interface FullPathItem extends BasicDataItem {
    label?: React.ReactNode;
}

export interface GroupItem {
    title?: string;
    children?: Array<DataItem>;
}

export interface TreeItem extends DataItem {
    children: Array<TreeItem>;
}

export interface RenderSourceItemProps extends DataItem {
    checked: boolean;
    onChange?: () => void;
}

export interface RenderSelectedItemProps extends DataItem {
    onRemove?: () => void;
    sortableHandle?: SortableHandle;
    /** The node's full path in treeList mode (only with showPath) */
    fullPath?: Array<FullPathItem>;
}

export interface EmptyContent {
    left?: React.ReactNode;
    right?: React.ReactNode;
    search?: React.ReactNode;
}

export type Type = 'list' | 'groupList' | 'treeList';

export interface SourcePanelProps {
    value: Array<string | number>;
    loading?: boolean;
    noMatch: boolean;
    filterData: Array<DataItem>;
    sourceData: Array<DataItem>;
    propsDataSource: DataSource;
    allChecked: boolean;
    showNumber: number;
    inputValue: string;
    onSearch: (searchString: string) => void;
    onAllClick: () => void;
    selectedItems: Map<string | number, DataItem>;
    onSelectOrRemove: (item: DataItem) => void;
    onSelect: (value: Array<string | number>) => void;
}

export type OnSortEnd = ({ oldIndex, newIndex }: OnSortEndProps) => void;

export interface SelectedPanelProps {
    length: number;
    selectedData: Array<DataItem>;
    onClear: () => void;
    onRemove: (item: DataItem) => void;
    onSortEnd: OnSortEnd;
}

export interface VirtualizeProps {
    height?: number | string;
    width?: number | string;
    itemSize: number;
}

export interface TransferPaginationProps {
    currentPage?: number;
    defaultCurrentPage?: number;
    pageSize?: number;
    onPageChange?: (currentPage: number) => void;
}

export interface ResolvedDataItem extends DataItem {
    _parent?: Omit<GroupItem, 'children'>;
    _path?: Array<DataItem>;
    _isLeaf?: boolean;
}

export type DataSource = Array<DataItem> | Array<GroupItem> | Array<TreeItem>;

interface HeaderConfig {
    totalContent: string;
    allContent: string;
    onAllClick: () => void;
    side: 'left' | 'right';
    showButton: boolean;
    num: number;
    allChecked?: boolean;
    leafOnlyNum?: number;
}

type SourceHeaderProps = {
    num: number;
    showButton: boolean;
    allChecked: boolean;
    onAllClick: () => void;
    leafOnlyNum?: number;
};

type SelectedHeaderProps = {
    num: number;
    showButton: boolean;
    onClear: () => void;
};

export interface TransferState {
    /** The uncontrolled selection */
    selectedValues: Array<string | number>;
    inputValue: string;
    /** The uncontrolled left page; a numeric `pagination.currentPage` takes its place */
    leftCurrentPage: number;
}

export interface TransferHandle {
    /** Searches as if `value` were typed into the search box, without calling `onSearch` */
    search: (value: string) => void;
}

// Transfer owns the Tree's value and data; its flat item map reads the fixed field names, so keyMaps and the other
// data shapes would make a check throw
const TRANSFER_OWNED_TREE_PROPS = ['value', 'ref', 'onChange', 'keyMaps', 'treeData', 'treeDataSimpleJson', 'onChangeWithObject'] as const;
const TRANSFER_OWNED_INPUT_PROPS = ['value', 'onChange'] as const;

export interface TransferProps extends ElementProps<'div', 'defaultValue' | 'onChange' | 'onSelect'> {
    style?: React.CSSProperties;
    className?: string;
    disabled?: boolean;
    dataSource?: DataSource;
    filter?: boolean | ((searchValue: string, item: DataItem) => boolean);
    defaultValue?: Array<string | number>;
    value?: Array<string | number>;
    inputProps?: Omit<InputProps, (typeof TRANSFER_OWNED_INPUT_PROPS)[number]>;
    type?: Type;
    emptyContent?: EmptyContent;
    draggable?: boolean;
    treeProps?: Omit<TreeProps, (typeof TRANSFER_OWNED_TREE_PROPS)[number]>;
    showPath?: boolean;
    loading?: boolean;
    virtualize?: VirtualizeProps;
    pagination?: TransferPaginationProps;
    onChange?: (values: Array<string | number>, items: Array<DataItem>) => void;
    onSelect?: (item: DataItem) => void;
    onDeselect?: (item: DataItem) => void;
    onSearch?: (searchValue: string) => void;
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    renderSourceItem?: (item: RenderSourceItemProps) => React.ReactNode;
    renderSelectedItem?: (item: RenderSelectedItemProps) => React.ReactNode;
    renderSourcePanel?: (sourcePanelProps: SourcePanelProps) => React.ReactNode;
    renderSelectedPanel?: (selectedPanelProps: SelectedPanelProps) => React.ReactNode;
    renderSourceHeader?: (headProps: SourceHeaderProps) => React.ReactNode;
    renderSelectedHeader?: (headProps: SelectedHeaderProps) => React.ReactNode;
    ref?: React.Ref<TransferHandle>;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    type: strings.TYPE_LIST as Type,
    dataSource: [],
    defaultValue: [],
    emptyContent: {},
    showPath: false,
} satisfies Partial<TransferProps>;

// stand-in handle, marked aria-disabled, while the sortable list loads or the transfer is disabled
function staticHandle(WrapperComponent: React.ComponentType) {
    return WrapperComponent;
}

// the list outer elements are module-level components, so the disabled state arrives through context
const [ListDisabledContext, useListDisabledContext] = createContext<boolean>('Transfer', { defaultValue: false });

function SelectedListOuter(props: React.ComponentProps<'div'>) {
    const { locale } = useLocale('Transfer');
    const disabled = useListDisabledContext();

    // disabled buttons leave nothing focusable, so the list itself takes the Tab stop to stay scrollable
    return <div {...props} aria-label={locale.selectedList} role="list" tabIndex={disabled ? 0 : undefined} />;
}

function SortableListOuter(props: React.ComponentProps<'div'>) {
    return <SelectedListOuter style={{ overflow: 'auto' }} {...props} />;
}

interface VirtualRowData {
    selectedData: Array<ResolvedDataItem>;
    renderItem: (item: ResolvedDataItem) => React.ReactNode;
}

function VirtualRow({ index, style, data }: VirtualListRowProps<VirtualRowData>) {
    return (
        <div style={style} role="presentation">
            {data.renderItem(data.selectedData[index])}
        </div>
    );
}

function getVirtualItemKey(index: number, data: VirtualRowData) {
    return data.selectedData[index]?.key ?? index;
}

/** null hides the empty state; other empty values fall back to the locale text */
function renderEmpty(side: 'left' | 'right', custom: React.ReactNode, fallback: string) {
    if (custom === null) {
        return null;
    }
    return <div className={clsx(`${prefixCls}-empty`, `${prefixCls}-${side}-empty`)}>{custom || fallback}</div>;
}

export default function Transfer(rawProps: TransferProps) {
    const props = useDefaultProps('Transfer', rawProps, defaultProps);

    const {
        ref,
        style,
        className,
        disabled,
        dataSource,
        filter,
        defaultValue,
        value,
        inputProps,
        type,
        emptyContent,
        draggable,
        treeProps,
        showPath,
        loading,
        virtualize,
        pagination,
        onChange,
        onSelect,
        onDeselect,
        onSearch,
        // reported by the foundation once the focus leaves the whole transfer, not on every inner focusout
        onBlur: _onBlur,
        renderSourceItem,
        renderSelectedItem,
        renderSourcePanel,
        renderSelectedPanel,
        renderSourceHeader,
        renderSelectedHeader,
        // the root is not a focus target: a tabIndex (one injected by a wrapping Tooltip included) goes to the search box
        tabIndex,
        // role="group" does not support aria-required
        'aria-required': _ariaRequired,
        ...rest
    } = props;

    const { locale } = useLocale('Transfer');

    const treeRef = useRef<TreeHandle>(null);
    const idPrefix = useId();

    const isServerRender = useIsServerRender();

    const [foundation, state] = useFoundation<Foundation, Adapter, TransferProps, TransferState>(
        TransferFoundation,
        props,
        () => TransferFoundation.getInitialState(props),
        (base) => ({
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            notifyChange: (values, items) => base.getProps().onChange?.(values, items),
            notifySearch: (input) => base.getProps().onSearch?.(input),
            notifySelect: (item) => base.getProps().onSelect?.(item),
            notifyDeselect: (item) => base.getProps().onDeselect?.(item),
            searchTree: (keyword) => treeRef.current?.search(keyword),
            notifyPageChange: (currentPage) => base.getProps().pagination?.onPageChange?.(currentPage),
        })
    );

    const view = TransferFoundation.deriveView<ResolvedDataItem>(props, state);
    const { data, selectedItems, values } = view;
    const { inputValue } = state;
    const isTree = type === strings.TYPE_TREE_TO_LIST;

    const transferCls = clsx(prefixCls, className, {
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-custom-panel`]: renderSelectedPanel && renderSourcePanel,
    });

    const attachTree = useCallback(
        (handle: TreeHandle | null) => {
            treeRef.current = handle;
            if (handle) {
                foundation.handleTreeMount();
            }
        },
        [foundation]
    );

    const onInputChange = (input: string) => foundation.handleInputChange(input, true);

    const onSelectOrRemove = (item: ResolvedDataItem) => foundation.handleSelectOrRemove(item);

    const onSortEnd = (sortProps: OnSortEndProps) => foundation.handleSortEnd(sortProps);

    const renderHeader = (headerConfig: HeaderConfig) => {
        const { totalContent, allContent, onAllClick, num, showButton, side } = headerConfig;
        if (side === 'left' && typeof renderSourceHeader === 'function') {
            const { allChecked, leafOnlyNum } = headerConfig;
            return renderSourceHeader({ num, showButton, allChecked, onAllClick, leafOnlyNum });
        }
        if (side === 'right' && typeof renderSelectedHeader === 'function') {
            return renderSelectedHeader({ num, showButton, onClear: onAllClick });
        }
        const headerCls = clsx(`${prefixCls}-header`, `${prefixCls}-${side}-header`);
        return (
            <div className={headerCls}>
                <span className={`${prefixCls}-header-total`}>{totalContent}</span>
                {showButton && (
                    <Button type="tertiary" className={`${prefixCls}-header-all`} disabled={disabled} size="small" theme="borderless" onClick={onAllClick}>
                        {allContent}
                    </Button>
                )}
            </div>
        );
    };

    const renderLeftItem = (item: ResolvedDataItem, index: number) => {
        const checked = selectedItems.has(item.key);
        if (renderSourceItem) {
            return (
                <div key={item.key} role="listitem">
                    {renderSourceItem({ ...item, checked, onChange: () => onSelectOrRemove(item) })}
                </div>
            );
        }
        const leftItemCls = clsx({
            [`${prefixCls}-item`]: true,
            [`${prefixCls}-item-disabled`]: item.disabled,
        });
        return (
            <Checkbox key={item.key} className={leftItemCls} role="listitem" checked={checked} disabled={item.disabled || disabled} x-semi-children-alias={`dataSource[${index}].label`} onChange={() => onSelectOrRemove(item)}>
                {item.label}
            </Checkbox>
        );
    };

    const renderLeftList = () => {
        let content: Array<React.ReactNode>;
        if (type === strings.TYPE_GROUP_LIST) {
            content = view.groups.map(({ index: groupIndex, title, items }) => {
                const titleId = `${idPrefix}-group-${groupIndex}`;
                return (
                    <div key={groupIndex} role="listitem">
                        <div id={titleId} className={`${prefixCls}-group-title`}>
                            {title}
                        </div>
                        <div aria-labelledby={titleId} role="list">
                            {items.map(({ item, index }) => renderLeftItem(item, index))}
                        </div>
                    </div>
                );
            });
        } else {
            content = view.visibleData.map(renderLeftItem);
        }
        return (
            <div
                className={`${prefixCls}-left-list`}
                aria-label={locale.optionList}
                role="list"
                // disabled checkboxes leave nothing focusable, so the list takes the Tab stop to stay scrollable
                tabIndex={disabled ? 0 : undefined}
            >
                {content}
            </div>
        );
    };

    const renderLeftTree = () => (
        <Tree
            ref={attachTree}
            aria-label={locale.optionList}
            disabled={disabled}
            multiple
            value={values}
            defaultExpandAll
            disableStrictly
            filterTreeNode
            leafOnly
            treeData={dataSource as any}
            searchRender={false}
            onChange={(treeValue: TreeValue) => foundation.handleSelect(treeValue)}
            {...omit((treeProps ?? {}) as Record<string, any>, TRANSFER_OWNED_TREE_PROPS)}
            style={{ flex: 1, overflow: 'auto', ...treeProps?.style }}
        />
    );

    const renderLeft = () => {
        const { showNumber, filterData, leafOnlyNum, allChecked, noMatch, pageSize, totalPage, currentPage } = view;
        const onAllClick = () => foundation.handleAll(!allChecked);

        if (renderSourcePanel) {
            return renderSourcePanel({
                loading,
                noMatch,
                filterData,
                sourceData: data,
                propsDataSource: dataSource,
                allChecked,
                showNumber,
                inputValue,
                selectedItems,
                value: values,
                onSelect: foundation.handleSelect,
                onAllClick,
                onSearch: onInputChange,
                onSelectOrRemove,
            });
        }

        const headerCom = renderHeader({
            totalContent: formatLocale(locale.total, { total: showNumber }),
            allContent: allChecked ? locale.clearSelectAll : locale.selectAll,
            onAllClick,
            side: 'left',
            showButton: view.showAllButton,
            num: showNumber,
            allChecked,
            leafOnlyNum,
        });

        let content: React.ReactNode = null;
        if (loading) {
            content = <Spin />;
        } else if (noMatch) {
            content = renderEmpty('left', emptyContent.search, locale.emptySearch);
        } else if (data.length === 0) {
            content = renderEmpty('left', emptyContent.left, locale.emptyLeft);
        } else if (isTree) {
            content = (
                <>
                    {headerCom}
                    {renderLeftTree()}
                </>
            );
        } else if (type === strings.TYPE_LIST || type === strings.TYPE_GROUP_LIST) {
            content = (
                <>
                    {headerCom}
                    {renderLeftList()}
                    {pagination && totalPage > 1 && (
                        <div className={`${prefixCls}-left-pagination`}>
                            <Pagination currentPage={currentPage} pageSize={pageSize} total={filterData.length} onPageChange={foundation.handlePageChange} />
                        </div>
                    )}
                </>
            );
        }

        const filterCom =
            filter === false ? null : (
                <search className={`${prefixCls}-filter`} aria-label={locale.filter}>
                    <Input
                        tabIndex={tabIndex}
                        disabled={disabled}
                        placeholder={locale.placeholder}
                        value={inputValue}
                        addonAfter={null}
                        addonBefore={null}
                        insetLabel={null}
                        showClear
                        prefix={<IconSearch />}
                        suffix={null}
                        onChange={onInputChange}
                        {...omit((inputProps ?? {}) as InputProps, TRANSFER_OWNED_INPUT_PROPS)}
                    />
                </search>
            );

        return (
            <section className={`${prefixCls}-left`}>
                {filterCom}
                {content}
            </section>
        );
    };

    const renderRightItem = (item: ResolvedDataItem, sortableHandle?: RenderItemProps['sortableHandle']) => {
        const onRemove = () => onSelectOrRemove(item);
        if (renderSelectedItem) {
            const fullPath = TransferFoundation.getFullPath(item, type, showPath);
            return (
                <div key={item.key} role="listitem">
                    {renderSelectedItem({ ...item, fullPath, onRemove, sortableHandle })}
                </div>
            );
        }
        const rightItemCls = clsx({
            [`${prefixCls}-item`]: true,
            [`${prefixCls}-right-item`]: true,
            [`${prefixCls}-right-item-draggable`]: draggable,
        });
        // the path keeps each label a node, as a label may be an element
        const label =
            isTree && showPath === true
                ? TransferFoundation.getPath(item).map((pathItem, i) => (
                      <Fragment key={pathItem.key}>
                          {i > 0 && strings.PATH_SEPARATOR}
                          {pathItem.label}
                      </Fragment>
                  ))
                : item.label;
        const DragHandle = draggable && sortableHandle ? sortableHandle(() => <IconHandle className={`${prefixCls}-right-item-drag-handler`} {...(sortableHandle === staticHandle ? { 'aria-label': locale.dragSort, role: 'button', 'aria-disabled': 'true' } : {})} />) : null;
        return (
            <div key={item.key} className={rightItemCls} role="listitem">
                {DragHandle && <DragHandle />}
                <div className={`${prefixCls}-right-item-text`}>{label}</div>
                <button
                    type="button"
                    className={clsx(`${prefixCls}-item-close-icon`, {
                        [`${prefixCls}-item-close-icon-disabled`]: item.disabled,
                    })}
                    aria-label={locale.remove}
                    disabled={item.disabled || disabled}
                    onClick={onRemove}
                >
                    <IconClose />
                </button>
            </div>
        );
    };

    const renderRightList = (selectedData: Array<ResolvedDataItem>, sortableHandle?: typeof staticHandle) => (
        <div className={`${prefixCls}-right-list`} aria-label={locale.selectedList} role="list" tabIndex={disabled ? 0 : undefined}>
            {selectedData.map((item) => renderRightItem(item, sortableHandle))}
        </div>
    );

    const renderVirtualList = (selectedData: Array<ResolvedDataItem>) => {
        const { height, width, itemSize } = virtualize;
        const listProps = {
            itemCount: selectedData.length,
            itemSize,
            itemKey: getVirtualItemKey,
            itemData: { selectedData, renderItem: (item: ResolvedDataItem) => renderRightItem(item) },
            className: `${prefixCls}-right-list ${prefixCls}-right-virtual-list`,
            outerElementType: SelectedListOuter,
        };
        if (typeof height !== 'number') {
            return (
                <div style={{ flexGrow: 1, minHeight: 0 }}>
                    <AutoSizer defaultHeight={height} defaultWidth={width}>
                        {({ height: autoHeight, width: autoWidth }) => (
                            <VirtualList height={autoHeight as number} width={autoWidth} {...listProps}>
                                {VirtualRow}
                            </VirtualList>
                        )}
                    </AutoSizer>
                </div>
            );
        }
        return (
            <VirtualList height={height} width={width || '100%'} {...listProps}>
                {VirtualRow}
            </VirtualList>
        );
    };

    const renderRight = () => {
        const { selectedData } = view;
        if (renderSelectedPanel) {
            return renderSelectedPanel({
                length: selectedData.length,
                selectedData,
                onClear: foundation.handleClear,
                onRemove: onSelectOrRemove,
                onSortEnd,
            });
        }
        const headerCom = renderHeader({
            totalContent: formatLocale(locale.selected, { total: selectedData.length }),
            allContent: locale.clear,
            onAllClick: foundation.handleClear,
            side: 'right',
            showButton: view.showClearButton,
            num: selectedData.length,
        });

        let content: React.ReactNode;
        if (!selectedData.length) {
            content = renderEmpty('right', emptyContent.right, locale.emptyRight);
        } else if (draggable && (disabled || isServerRender)) {
            // renderToString does not wait for lazy and would leave a boundary that hydration renders over again
            content = renderRightList(selectedData, staticHandle);
        } else if (draggable) {
            content = (
                <Suspense fallback={renderRightList(selectedData, staticHandle)}>
                    <SortableList
                        container={SortableListOuter}
                        dragHandleLabel={locale.dragSort}
                        dragOverlayCls={`${prefixCls}-right-item-drag-item-move`}
                        items={selectedData.map((item) => item.key)}
                        prefix={`${prefixCls}-right-item`}
                        renderItem={({ id, sortableHandle }) => renderRightItem(selectedItems.get(id), sortableHandle)}
                        onSortEnd={onSortEnd}
                    />
                </Suspense>
            );
        } else if (virtualize && Object.keys(virtualize).length > 0) {
            content = renderVirtualList(selectedData);
        } else {
            content = renderRightList(selectedData);
        }

        return (
            <section className={`${prefixCls}-right`}>
                {headerCom}
                {content}
            </section>
        );
    };

    useImperativeHandle(props.ref, () => ({ search: (value: string) => foundation.handleInputChange(value, false) }), [foundation]);

    return (
        <div role={namedRole(rest)} {...rest} className={transferCls} style={style} onBlur={foundation.handleFocusOut}>
            <ListDisabledContext value={Boolean(disabled)}>
                {renderLeft()}
                {renderRight()}
            </ListDisabledContext>
        </div>
    );
}
