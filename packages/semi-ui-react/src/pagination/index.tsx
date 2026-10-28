import type React from 'react';
import { useEffect } from 'react';
import clsx from 'clsx';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { cssClasses, numbers } from '@fibrae/semi-foundation/pagination/constants';
import PaginationFoundation, { type PageList, type PageRange, type PaginationAdapter } from '@fibrae/semi-foundation/pagination/foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/pagination/pagination.scss';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import VirtualList, { type VirtualListRowProps } from '../_base/virtual-list';
import { hasContent } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import InputNumber from '../input-number/index';
import LocaleConsumer from '../locale/locale-consumer';
import Popover from '../popover/index';
import Select from '../select/index';
import type { Position } from '../tooltip';

const prefixCls = cssClasses.PREFIX;
const { Option } = Select;

export interface PaginationProps extends ElementProps<'ul', 'onChange'> {
    total?: number;
    showTotal?: boolean;
    pageSize?: number;
    pageSizeOpts?: Array<number>;
    size?: 'small' | 'default';
    currentPage?: number;
    defaultCurrentPage?: number;
    onPageChange?: (currentPage: number) => void;
    onPageSizeChange?: (newPageSize: number) => void;
    onChange?: (currentPage: number, pageSize: number) => void;
    prevText?: React.ReactNode;
    nextText?: React.ReactNode;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    popoverPosition?: PopoverPosition;
    style?: React.CSSProperties;
    className?: string;
    hideOnSinglePage?: boolean;
    hoverShowPageSelect?: boolean;
    disabled?: boolean;
    /**
     * Prevents adjusting currentPage when pageSize changes; handle it in onPageSizeChange instead.
     * @default false
     */
    preventPageChangeOnPageSizeChange?: boolean;
    /** Attached to the root ul, in both sizes */
    ref?: React.Ref<HTMLUListElement>;
}

export interface PaginationState {
    currentPage: number;
    pageSize: number;
    quickJumpPage: string | number;
}

export type PaginationLocale = Locale['Pagination'];
export type PopoverPosition = Position;
export type { PageList };

const defaultProps = {
    total: 1,
    showTotal: false,
    pageSize: null,
    pageSizeOpts: [...numbers.PAGE_SIZE_OPTION],
    defaultCurrentPage: 1,
    size: 'default',
    showSizeChanger: false,
    className: '',
    hideOnSinglePage: false,
    showQuickJumper: false,
    disabled: false,
    preventPageChangeOnPageSizeChange: false,
} satisfies Partial<PaginationProps>;

interface RestPageData {
    start: number;
    goPage: (page: number) => void;
    pageLabel: (page: number) => string;
}

const hasTextContent = (node: React.ReactNode) => (typeof node === 'string' ? node !== '' : typeof node === 'number');

function RestPageItem({ index, style, data }: VirtualListRowProps<RestPageData>) {
    const page = data.start + index;

    return (
        <button type="button" className={`${prefixCls}-rest-item`} style={style} aria-label={data.pageLabel(page)} onClick={() => data.goPage(page)}>
            {page}
        </button>
    );
}

export default function Pagination(rawProps: PaginationProps) {
    const props = useDefaultProps('Pagination', rawProps, defaultProps);

    const {
        ref,
        total,
        showTotal,
        pageSize: pageSizeProp,
        pageSizeOpts,
        size,
        currentPage: currentPageProp,
        defaultCurrentPage,
        onPageChange,
        onPageSizeChange,
        onChange,
        prevText,
        nextText,
        showSizeChanger,
        showQuickJumper,
        popoverPosition,
        style,
        className,
        hideOnSinglePage,
        hoverShowPageSelect,
        disabled,
        preventPageChangeOnPageSizeChange,
        ...rest
    } = props;

    const { direction } = useConfigContext();

    const [foundation, state] = useFoundation<PaginationFoundation<PaginationProps, PaginationState>, PaginationAdapter<PaginationProps, PaginationState>, PaginationProps, PaginationState>(
        PaginationFoundation,
        props,
        () => PaginationFoundation.getInitialState(props),
        (base) => ({
            updatePageSize: (pageSize) => base.setState({ pageSize }),
            updateQuickJumpPage: (quickJumpPage) => base.setState({ quickJumpPage }),
            setCurrentPage: (currentPage) => base.setState({ currentPage }),
            notifyPageChange: (pageIndex) => base.getProps().onPageChange?.(pageIndex),
            notifyPageSizeChange: (pageSize) => base.getProps().onPageSizeChange?.(pageSize),
            notifyChange: (pageIndex, pageSize) => base.getProps().onChange?.(pageIndex, pageSize),
        })
    );

    // the small size has no size changer
    const sizeChangerShown = Boolean(props.showSizeChanger && props.size !== 'small');
    const sizeChangerKeepsSinglePage = sizeChangerShown && Boolean(props.hideOnSinglePage);
    const { currentPage, pageSize, quickJumpPage } = state;
    const totalPageNum = PaginationFoundation.getTotalPageNumber(total, pageSize);

    // only the pageSize prop may overwrite the page size: a total change must not revert the size changer's choice
    useDidUpdate(props.currentPage, () => foundation.updatePage(props.currentPage));
    useDidUpdate(props.total, () => foundation.updatePage(props.currentPage));

    // a prop echoing the size changer's choice must not reset the page
    useDidUpdate(props.pageSize, () => {
        if (props.pageSize !== state.pageSize) {
            foundation.updatePage(props.currentPage, props.pageSize);
        }
    });

    useEffect(() => {
        warning(sizeChangerKeepsSinglePage, '[Semi Pagination] You should not use showSizeChanger and hideOnSinglePage in ths same time. At this time, hideOnSinglePage no longer takes effect, otherwise there may be a problem that the switch entry disappears');
    }, [sizeChangerKeepsSinglePage]);

    if (totalPageNum < 2 && hideOnSinglePage && !sizeChangerShown) {
        return null;
    }

    const { prevDisabled, nextDisabled } = PaginationFoundation.getDisabled(currentPage, total, pageSize);

    const renderPrevBtn = (locale: PaginationLocale) => {
        const isDisabled = prevDisabled || disabled;
        return (
            <li>
                <button
                    type="button"
                    className={clsx(`${prefixCls}-item`, `${prefixCls}-prev`, {
                        [`${prefixCls}-item-disabled`]: isDisabled,
                    })}
                    // visible text names the button (WCAG label in name); otherwise the locale does
                    aria-label={hasTextContent(prevText) ? undefined : locale.prev}
                    disabled={isDisabled}
                    x-semi-prop="prevText"
                    onClick={() => foundation.goPrev()}
                >
                    {hasContent(prevText) ? prevText : <IconChevronLeft size="large" />}
                </button>
            </li>
        );
    };

    const renderNextBtn = (locale: PaginationLocale) => {
        const isDisabled = nextDisabled || disabled;
        return (
            <li>
                <button type="button" className={clsx(`${prefixCls}-item`, { [`${prefixCls}-item-disabled`]: isDisabled }, `${prefixCls}-next`)} aria-label={hasTextContent(nextText) ? undefined : locale.next} disabled={isDisabled} x-semi-prop="nextText" onClick={() => foundation.goNext()}>
                    {hasContent(nextText) ? nextText : <IconChevronRight size="large" />}
                </button>
            </li>
        );
    };

    // tens of thousands of pages are possible, so the list is virtualized
    const renderRestPageList = ({ start, count }: PageRange, locale: PaginationLocale) => {
        const itemHeight = 32;
        return (
            <VirtualList
                className={`${prefixCls}-rest-list`}
                style={{ direction }}
                height={itemHeight * Math.min(count, 5)}
                itemCount={count}
                itemData={{
                    start,
                    goPage: (page: number) => foundation.goPage(page),
                    pageLabel: (page: number) => locale.pageN.replace('${page}', String(page)),
                }}
                itemSize={itemHeight}
                width={78}
            >
                {RestPageItem}
            </VirtualList>
        );
    };

    const renderQuickJump = (locale: PaginationLocale) => {
        if (!showQuickJumper) {
            return null;
        }
        const isDisabled = totalPageNum < 2 || disabled;
        return (
            <li className={clsx(`${prefixCls}-quickjump`, { [`${prefixCls}-quickjump-disabled`]: isDisabled })}>
                <span>{locale.jumpTo}</span>
                <InputNumber
                    className={`${prefixCls}-quickjump-input-number`}
                    aria-label={locale.jumpTo}
                    disabled={isDisabled}
                    value={quickJumpPage}
                    // the adornments and showClear are set so global InputNumber defaults cannot add them to the jumper
                    addonAfter={null}
                    addonBefore={null}
                    hideButtons
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    onBlur={() => foundation.handleQuickJumpBlur()}
                    onChange={(v) => foundation.handleQuickJumpNumberChange(v)}
                    onEnterPress={(e) => foundation.handleQuickJumpEnterPress((e.target as HTMLInputElement).value)}
                />
                <span>{locale.page}</span>
            </li>
        );
    };

    const renderSmallPage = (locale: PaginationLocale) => {
        const contentCls = clsx(`${prefixCls}-item`, `${prefixCls}-item-small`, {
            [`${prefixCls}-item-all-disabled`]: disabled,
        });
        const text = `${currentPage}/${totalPageNum} `;
        return (
            <ul {...rest} ref={ref} className={clsx(`${prefixCls}-small`, prefixCls, className, { [`${prefixCls}-disabled`]: disabled })} style={style}>
                {renderPrevBtn(locale)}
                <li>
                    {hoverShowPageSelect && !disabled ? (
                        // opens on hover or focus; ArrowDown moves into it
                        <Popover content={renderRestPageList({ start: 1, count: totalPageNum }, locale)}>
                            <button type="button" className={contentCls}>
                                {text}
                            </button>
                        </Popover>
                    ) : (
                        <div className={contentCls}>{text}</div>
                    )}
                </li>
                {renderNextBtn(locale)}
                {renderQuickJump(locale)}
            </ul>
        );
    };

    const renderPageSizeSwitch = (locale: PaginationLocale) => {
        if (!showSizeChanger) {
            return null;
        }
        const switchPosition = popoverPosition === undefined ? (direction === 'rtl' ? 'bottomRight' : 'bottomLeft') : popoverPosition;
        const pageSizeToken = locale.pageSize;
        return (
            <li className={`${prefixCls}-switch`}>
                <Select dropdownClassName={`${prefixCls}-select-dropdown`} aria-label={locale.pageSizeSelector} disabled={disabled} value={pageSize} clickToHide position={switchPosition || 'bottomRight'} onChange={(newPageSize) => foundation.changePageSize(newPageSize)}>
                    {PaginationFoundation.getPageSizeOpts(pageSizeOpts, pageSize).map((option) => (
                        <Option key={option} value={option}>
                            <span>{pageSizeToken.replace('${pageSize}', option.toString())}</span>
                        </Option>
                    ))}
                </Select>
            </li>
        );
    };

    const renderPageList = (locale: PaginationLocale) => {
        const { pageList, restLeftRange, restRightRange } = PaginationFoundation.getPageList(currentPage, total, pageSize);
        return pageList.map((page, i) => {
            const isActive = currentPage === page;
            const pageEl = (
                <button
                    type="button"
                    className={clsx(`${prefixCls}-item`, {
                        [`${prefixCls}-item-active`]: isActive,
                        [`${prefixCls}-item-all-disabled`]: disabled,
                        [`${prefixCls}-item-all-disabled-active`]: isActive && disabled,
                    })}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={page === '...' ? locale.more : locale.pageN.replace('${page}', String(page))}
                    disabled={disabled}
                    onClick={() => foundation.goPage(page)}
                >
                    {page}
                </button>
            );
            return (
                // not position-based: a page number that shifts position keeps its button, and with it keyboard focus
                <li key={page === '...' ? (i < 3 ? 'rest-left' : 'rest-right') : page}>
                    {page === '...' && !disabled ? (
                        // opens on hover or focus; ArrowDown moves into it
                        <Popover content={renderRestPageList(i < 3 ? restLeftRange : restRightRange, locale)} position={popoverPosition} trigger="hover">
                            {pageEl}
                        </Popover>
                    ) : (
                        pageEl
                    )}
                </li>
            );
        });
    };

    const renderDefaultPage = (locale: PaginationLocale) => (
        <ul {...rest} ref={ref} className={clsx(className, prefixCls, { [`${prefixCls}-disabled`]: disabled })} style={style}>
            {showTotal && <li className={`${prefixCls}-total`}>{locale.total.replace('${total}', totalPageNum.toString())}</li>}
            {renderPrevBtn(locale)}
            {renderPageList(locale)}
            {renderNextBtn(locale)}
            {renderPageSizeSwitch(locale)}
            {renderQuickJump(locale)}
        </ul>
    );

    return <LocaleConsumer componentName="Pagination">{(locale) => (size === 'small' ? renderSmallPage(locale) : renderDefaultPage(locale))}</LocaleConsumer>;
}
