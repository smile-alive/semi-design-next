import { type JSX, For, Show, children, createMemo, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/pagination/constants';
import PaginationFoundation, { type PageList, type PaginationAdapter, type PaginationState } from '@fibrae/semi-foundation/components/pagination/foundation';
import { formatLocale, type Locale } from '@fibrae/semi-foundation/locale';
import '@fibrae/semi-foundation/components/pagination/pagination.scss';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { hasContent, mergeRefs } from '../../utils/index';
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

export interface PaginationProps extends ElementProps<'nav', 'onChange'> {
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

export type { PaginationState };

type Foundation = PaginationFoundation<PaginationProps>;
type Adapter = PaginationAdapter<PaginationProps>;

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
        'aria-label',
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
            notifyPageChange: (pageIndex) => base.getProps().onPageChange?.(pageIndex),
            notifyPageSizeChange: (pageSize) => base.getProps().onPageSizeChange?.(pageSize),
            notifyChange: (pageIndex, pageSize) => base.getProps().onChange?.(pageIndex, pageSize),
        })
    );

    const pageData = createMemo(() => PaginationFoundation.getPageList(state().currentPage, local.total, state().pageSize));
    const pageKeys = createMemo(() => pageData().pageList.map((page, i): PageKey => (page === '...' ? (i < 3 ? 'rest-left' : 'rest-right') : page)));
    const pageSizeOpts = createMemo(() => PaginationFoundation.getPageSizeOpts(local.pageSizeOpts, state().pageSize));
    const view = createMemo(() => PaginationFoundation.getView(props, state().pageSize, config().direction));

    const text = () => locale().locale;

    const small = () => local.size === 'small';

    const disabledState = () => PaginationFoundation.getDisabled(state().currentPage, local.total, state().pageSize);

    const pageLabel = (page: number) => formatLocale(text().pageN, { page });

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
        const counterText = () => `${state().currentPage}/${view().totalPageNum} `;

        return (
            <li>
                {/* opens on hover or focus; ArrowDown moves into it */}
                <Show when={local.hoverShowPageSelect && !local.disabled} fallback={<div class={counterClass()}>{counterText()}</div>}>
                    <Popover content={<RestPages count={view().totalPageNum} start={1} onSelect={foundation.goPage} />}>
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

    return (
        <Show when={!view().hidden}>
            {/* Show's children memo tracks the ref read; a spread props signal would recreate the whole list */}
            <nav {...rest} ref={untrack(() => mergeRefs(local.ref, registerTrigger))} aria-label={local['aria-label'] ?? text().label} class={clsx(local.class, `${prefixCls}-wrapper`)}>
                <ul class={clsx(prefixCls, { [`${prefixCls}-small`]: small(), [`${prefixCls}-disabled`]: local.disabled })}>
                    <Show when={local.showTotal && !small()}>
                        <li class={`${prefixCls}-total`}>{formatLocale(text().total, { total: view().totalPageNum })}</li>
                    </Show>
                    <StepButton disabled={disabledState().prevDisabled || local.disabled} kind="prev" label={text().prev} text={local.prevText} onClick={foundation.goPrev} />
                    <Show when={small()} fallback={<For each={pageKeys()}>{(pageKey) => <PageItem pageKey={pageKey} />}</For>}>
                        {renderSmallCounter()}
                    </Show>
                    <StepButton disabled={disabledState().nextDisabled || local.disabled} kind="next" label={text().next} text={local.nextText} onClick={foundation.goNext} />
                    <Show when={view().sizeChangerShown}>
                        <li class={`${prefixCls}-switch`}>
                            <Select<number, false>
                                dropdownClassName={`${prefixCls}-select-dropdown`}
                                aria-label={text().pageSizeSelector}
                                disabled={local.disabled}
                                value={state().pageSize}
                                clickToHide
                                position={view().switchPosition}
                                // changePageSize takes one number: global Select defaults must not make it search, create, multiple or object-valued, nor add a clear button or adornments
                                allowCreate={false}
                                filter={false}
                                insetLabel={null}
                                multiple={false}
                                onChangeWithObject={false}
                                prefix={null}
                                showClear={false}
                                suffix={null}
                                onChange={(newPageSize) => newPageSize !== undefined && foundation.changePageSize(newPageSize)}
                            >
                                <For each={pageSizeOpts()}>
                                    {(option) => (
                                        <Select.Option value={option}>
                                            <span>{formatLocale(text().pageSize, { pageSize: option })}</span>
                                        </Select.Option>
                                    )}
                                </For>
                            </Select>
                        </li>
                    </Show>
                    <Show when={local.showQuickJumper}>
                        <li class={clsx(`${prefixCls}-quickjump`, { [`${prefixCls}-quickjump-disabled`]: view().quickJumpDisabled })}>
                            <span>{text().jumpTo}</span>
                            {/* the adornments and showClear are set so global InputNumber defaults cannot add them to the jumper */}
                            <InputNumber
                                class={`${prefixCls}-quickjump-input-number`}
                                aria-label={text().jumpTo}
                                disabled={view().quickJumpDisabled}
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
            </nav>
        </Show>
    );
}
