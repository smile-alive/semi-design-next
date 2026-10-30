import { type JSX, For, Show, children, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { cssClasses, numbers } from '@fibrae/semi-foundation/pagination/constants';
import PaginationFoundation, { type PageList, type PaginationAdapter } from '@fibrae/semi-foundation/pagination/foundation';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/pagination/pagination.scss';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import InputNumber from '../input-number';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import Select from '../select';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import RestPages from './rest-pages';

const prefixCls = cssClasses.PREFIX;

export type PaginationLocale = Locale['Pagination'];
export type PopoverPosition = Position;
export type { PageList };

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
    prevText?: JSX.Element;
    nextText?: JSX.Element;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    popoverPosition?: PopoverPosition;
    hideOnSinglePage?: boolean;
    hoverShowPageSelect?: boolean;
    disabled?: boolean;
    /**
     * Prevents adjusting currentPage when pageSize changes; handle it in onPageSizeChange instead.
     * @default false
     */
    preventPageChangeOnPageSizeChange?: boolean;
}

export interface PaginationState {
    currentPage: number;
    pageSize: number;
    quickJumpPage: string | number;
}

type Foundation = PaginationFoundation<PaginationProps, PaginationState>;
type Adapter = PaginationAdapter<PaginationProps, PaginationState>;

const defaultProps = {
    total: 1,
    showTotal: false,
    pageSizeOpts: [...numbers.PAGE_SIZE_OPTION],
    defaultCurrentPage: 1,
    size: 'default',
    showSizeChanger: false,
    hideOnSinglePage: false,
    showQuickJumper: false,
    disabled: false,
    preventPageChangeOnPageSizeChange: false,
} satisfies Partial<PaginationProps>;

// an ellipsis is keyed by its side, so a page number that shifts position keeps its button, and with it keyboard focus
type PageKey = number | 'rest-left' | 'rest-right';

// visible text names the button (WCAG label in name); otherwise the locale does
const namesButton = (node: unknown) => (typeof node === 'string' ? node !== '' : typeof node === 'number');

interface StepButtonProps {
    kind: 'prev' | 'next';
    text: JSX.Element;
    label: string;
    disabled: boolean;
    onClick: () => void;
}

function StepButton(props: StepButtonProps) {
    const resolved = children(() => props.text);

    return (
        <li>
            <button type="button" class={clsx(`${prefixCls}-item`, `${prefixCls}-${props.kind}`, { [`${prefixCls}-item-disabled`]: props.disabled })} aria-label={namesButton(resolved()) ? undefined : props.label} disabled={props.disabled} x-semi-prop={`${props.kind}Text`} onClick={() => props.onClick()}>
                <Show when={hasContent(resolved())} fallback={props.kind === 'prev' ? <IconChevronLeft size="large" /> : <IconChevronRight size="large" />}>
                    {resolved()}
                </Show>
            </button>
        </li>
    );
}

export default function Pagination(rawProps: PaginationProps) {
    const props = useDefaultProps('Pagination', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'total',
        'showTotal',
        'pageSize',
        'pageSizeOpts',
        'size',
        'currentPage',
        'defaultCurrentPage',
        'onPageChange',
        'onPageSizeChange',
        'onChange',
        'prevText',
        'nextText',
        'showSizeChanger',
        'showQuickJumper',
        'popoverPosition',
        'class',
        'ref',
        'hideOnSinglePage',
        'hoverShowPageSelect',
        'disabled',
        'preventPageChangeOnPageSizeChange',
    ]);

    const config = useConfig();
    const locale = useLocale('Pagination');

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, PaginationProps, PaginationState>(
        PaginationFoundation,
        props,
        (view) => PaginationFoundation.getInitialState(view),
        (base) => ({
            updatePageSize: (pageSize) => base.setState({ pageSize }),
            updateQuickJumpPage: (quickJumpPage) => base.setState({ quickJumpPage }),
            setCurrentPage: (currentPage) => base.setState({ currentPage }),
            notifyPageChange: (pageIndex) => base.getProps().onPageChange?.(pageIndex),
            notifyPageSizeChange: (pageSize) => base.getProps().onPageSizeChange?.(pageSize),
            notifyChange: (pageIndex, pageSize) => base.getProps().onChange?.(pageIndex, pageSize),
        })
    );

    const pageData = createMemo(() => PaginationFoundation.getPageList(state().currentPage, local.total, state().pageSize));
    const pageKeys = createMemo(() => pageData().pageList.map((page, i): PageKey => (page === '...' ? (i < 3 ? 'rest-left' : 'rest-right') : page)));
    const pageSizeOpts = createMemo(() => PaginationFoundation.getPageSizeOpts(local.pageSizeOpts, state().pageSize));

    const text = () => locale().locale;

    const small = () => local.size === 'small';

    // the small size has no size changer
    const sizeChangerShown = () => local.showSizeChanger && !small();

    const sizeChangerKeepsSinglePage = createMemo(() => sizeChangerShown() && local.hideOnSinglePage);

    const totalPageNum = () => PaginationFoundation.getTotalPageNumber(local.total, state().pageSize);

    const hidden = () => totalPageNum() < 2 && local.hideOnSinglePage && !sizeChangerShown();

    const disabledState = () => PaginationFoundation.getDisabled(state().currentPage, local.total, state().pageSize);

    const quickJumpDisabled = () => totalPageNum() < 2 || local.disabled;

    const pageLabel = (page: number) => text().pageN.replace('${page}', String(page));

    const PageItem = (itemProps: { pageKey: PageKey }) => {
        const page = () => (typeof itemProps.pageKey === 'number' ? itemProps.pageKey : '...');
        const isActive = () => state().currentPage === page();
        const range = () => (itemProps.pageKey === 'rest-left' ? pageData().restLeftRange : pageData().restRightRange);

        const pageButton = (triggerProps?: object) => (
            <button
                {...triggerProps}
                type="button"
                class={clsx(`${prefixCls}-item`, {
                    [`${prefixCls}-item-active`]: isActive(),
                    [`${prefixCls}-item-all-disabled`]: local.disabled,
                    [`${prefixCls}-item-all-disabled-active`]: isActive() && local.disabled,
                })}
                aria-current={isActive() ? 'page' : undefined}
                aria-label={itemProps.pageKey === 'rest-left' || itemProps.pageKey === 'rest-right' ? text().more : pageLabel(itemProps.pageKey)}
                disabled={local.disabled}
                onClick={() => foundation.goPage(page())}
            >
                {page()}
            </button>
        );

        return (
            <li>
                {/* opens on hover or focus; ArrowDown moves into it */}
                <Show when={typeof itemProps.pageKey === 'string' && !local.disabled} fallback={pageButton()}>
                    <Popover content={<RestPages count={range().count} start={range().start} onSelect={foundation.goPage} />} position={local.popoverPosition} trigger="hover">
                        {(getTriggerProps) => pageButton(getTriggerProps())}
                    </Popover>
                </Show>
            </li>
        );
    };

    const renderSmallCounter = () => {
        const counterClass = () =>
            clsx(`${prefixCls}-item`, `${prefixCls}-item-small`, {
                [`${prefixCls}-item-all-disabled`]: local.disabled,
            });
        const counterText = () => `${state().currentPage}/${totalPageNum()} `;

        return (
            <li>
                {/* opens on hover or focus; ArrowDown moves into it */}
                <Show when={local.hoverShowPageSelect && !local.disabled} fallback={<div class={counterClass()}>{counterText()}</div>}>
                    <Popover content={<RestPages count={totalPageNum()} start={1} onSelect={foundation.goPage} />}>
                        {(getTriggerProps) => (
                            <button {...getTriggerProps()} type="button" class={counterClass()}>
                                {counterText()}
                            </button>
                        )}
                    </Popover>
                </Show>
            </li>
        );
    };

    // only the pageSize prop may overwrite the page size: a total change must not revert the size changer's choice
    useWatch(
        () => local.currentPage,
        (page) => foundation.updatePage(page)
    );

    useWatch(
        () => local.total,
        () => foundation.updatePage(local.currentPage)
    );

    // a prop echoing the size changer's choice must not reset the page
    useWatch(
        () => local.pageSize,
        (pageSize) => {
            if (pageSize !== state().pageSize) {
                foundation.updatePage(local.currentPage, pageSize);
            }
        }
    );

    createEffect(
        on(sizeChangerKeepsSinglePage, (conflict) => {
            warning(conflict, '[Semi Pagination] You should not use showSizeChanger and hideOnSinglePage in ths same time. At this time, hideOnSinglePage no longer takes effect, otherwise there may be a problem that the switch entry disappears');
        })
    );

    return (
        <Show when={!hidden()}>
            {/* Show's children memo tracks the ref read; a spread props signal would recreate the whole list */}
            <ul {...rest} ref={untrack(() => mergeRefs(local.ref, registerTrigger))} class={clsx(prefixCls, local.class, { [`${prefixCls}-small`]: small(), [`${prefixCls}-disabled`]: local.disabled })}>
                <Show when={local.showTotal && !small()}>
                    <li class={`${prefixCls}-total`}>{text().total.replace('${total}', totalPageNum().toString())}</li>
                </Show>
                <StepButton disabled={disabledState().prevDisabled || local.disabled} kind="prev" label={text().prev} text={local.prevText} onClick={foundation.goPrev} />
                <Show when={small()} fallback={<For each={pageKeys()}>{(pageKey) => <PageItem pageKey={pageKey} />}</For>}>
                    {renderSmallCounter()}
                </Show>
                <StepButton disabled={disabledState().nextDisabled || local.disabled} kind="next" label={text().next} text={local.nextText} onClick={foundation.goNext} />
                <Show when={sizeChangerShown()}>
                    <li class={`${prefixCls}-switch`}>
                        <Select<number>
                            dropdownClassName={`${prefixCls}-select-dropdown`}
                            aria-label={text().pageSizeSelector}
                            disabled={local.disabled}
                            value={state().pageSize}
                            clickToHide
                            position={local.popoverPosition ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
                            onChange={(newPageSize) => newPageSize !== undefined && foundation.changePageSize(newPageSize)}
                        >
                            <For each={pageSizeOpts()}>
                                {(option) => (
                                    <Select.Option value={option}>
                                        <span>{text().pageSize.replace('${pageSize}', option.toString())}</span>
                                    </Select.Option>
                                )}
                            </For>
                        </Select>
                    </li>
                </Show>
                <Show when={local.showQuickJumper}>
                    <li class={clsx(`${prefixCls}-quickjump`, { [`${prefixCls}-quickjump-disabled`]: quickJumpDisabled() })}>
                        <span>{text().jumpTo}</span>
                        {/* the adornments and showClear are set so global InputNumber defaults cannot add them to the jumper */}
                        <InputNumber
                            class={`${prefixCls}-quickjump-input-number`}
                            aria-label={text().jumpTo}
                            disabled={quickJumpDisabled()}
                            value={state().quickJumpPage}
                            addonAfter={null}
                            addonBefore={null}
                            hideButtons
                            insetLabel={null}
                            showClear={false}
                            prefix={null}
                            suffix={null}
                            onBlur={foundation.handleQuickJumpBlur}
                            onChange={foundation.handleQuickJumpNumberChange}
                            onEnterPress={(event) => foundation.handleQuickJumpEnterPress(event.currentTarget.value)}
                        />
                        <span>{text().page}</span>
                    </li>
                </Show>
            </ul>
        </Show>
    );
}
