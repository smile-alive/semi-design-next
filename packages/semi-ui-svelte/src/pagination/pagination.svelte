<script lang="ts">
    import { cssClasses, numbers } from '@fibrae/semi-foundation/pagination/constants';
    import PaginationFoundation, { type PaginationAdapter, type PaginationBaseProps, type PaginationBaseState } from '@fibrae/semi-foundation/pagination/foundation';
    import { ENTER_KEY, isComposing } from '@fibrae/semi-foundation/utils/key-code';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/pagination/pagination.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import { InputNumber } from '../input-number/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import { Select } from '../select/index.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import type { PaginationProps } from './interface.js';
    import RestPages from './rest-pages.svelte';
    import StepButton from './step-button.svelte';

    // The props the foundation reads, plus the ones its initial state reads
    interface FoundationProps extends PaginationBaseProps {
        defaultCurrentPage?: number;
        pageSize?: number;
        pageSizeOpts?: readonly number[];
    }

    type Foundation = PaginationFoundation<FoundationProps, PaginationBaseState>;
    type Adapter = PaginationAdapter<FoundationProps, PaginationBaseState>;

    const defaults = useDefaultProps('Pagination');

    // No fallback on `currentPage` and `pageSize`: a bound `undefined` (back to uncontrolled) would throw with one, so
    // their global defaults are read below
    let {
        currentPage = $bindable(),
        pageSize = $bindable(),
        total = defaults('total', 1),
        showTotal = defaults('showTotal', false),
        pageSizeOpts = defaults('pageSizeOpts', [...numbers.PAGE_SIZE_OPTION]),
        size = defaults('size', 'default'),
        showSizeChanger = defaults('showSizeChanger', false),
        showQuickJumper = defaults('showQuickJumper', false),
        popoverPosition = defaults('popoverPosition'),
        hideOnSinglePage = defaults('hideOnSinglePage', false),
        hoverShowPageSelect = defaults('hoverShowPageSelect'),
        disabled = defaults('disabled', false),
        preventPageChangeOnPageSizeChange = defaults('preventPageChangeOnPageSizeChange', false),
        onPageChange,
        onPageSizeChange,
        onChange,
        prevText,
        nextText,
        ...rest
    }: PaginationProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Pagination');

    const globalCurrentPage = defaults('currentPage');
    const globalPageSize = defaults('pageSize');

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get currentPage() {
            return currentPage ?? globalCurrentPage;
        },
        get defaultCurrentPage() {
            return 1;
        },
        get pageSize() {
            return pageSize ?? globalPageSize;
        },
        get pageSizeOpts() {
            return pageSizeOpts;
        },
        get preventPageChangeOnPageSizeChange() {
            return preventPageChangeOnPageSizeChange;
        },
        get total() {
            return total;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, PaginationBaseState>(
        PaginationFoundation,
        foundationProps,
        (view) => PaginationFoundation.getInitialState(view),
        (base) => ({
            updatePageSize: (next) => base.setState({ pageSize: next }),
            updateQuickJumpPage: (quickJumpPage) => base.setState({ quickJumpPage }),
            setCurrentPage: (next) => base.setState({ currentPage: next }),
            notifyPageChange: (pageIndex) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                currentPage = pageIndex;
                onPageChange?.(pageIndex);
            },
            notifyPageSizeChange: (next) => {
                pageSize = next;
                onPageSizeChange?.(next);
            },
            notifyChange: (pageIndex, next) => onChange?.(pageIndex, next),
        })
    );

    const prefix = cssClasses.PREFIX;
    const text = $derived(locale().locale);
    const sizeChangerShown = $derived(showSizeChanger && size !== 'small');
    const totalPageNum = $derived(PaginationFoundation.getTotalPageNumber(total, states().pageSize));
    const disabledState = $derived(PaginationFoundation.getDisabled(states().currentPage, total, states().pageSize));
    const pageData = $derived(PaginationFoundation.getPageList(states().currentPage, total, states().pageSize));
    const hidden = $derived(totalPageNum < 2 && hideOnSinglePage && !sizeChangerShown);
    const quickJumpDisabled = $derived(totalPageNum < 2 || disabled);
    const smallText = $derived(`${states().currentPage}/${totalPageNum} `);
    const switchPosition = $derived(popoverPosition ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));

    const sizeOptions = $derived(
        PaginationFoundation.getPageSizeOpts(pageSizeOpts, states().pageSize).map((option) => ({
            value: option,
            label: text.pageSize.replace('${pageSize}', String(option)),
        }))
    );

    const pageLabel = (page: number) => text.pageN.replace('${page}', String(page));

    const isRest = (page: number | '...') => page === '...' && !disabled;

    const changePageSize = (value: unknown) => {
        if (typeof value === 'number') {
            foundation.changePageSize(value);
        }
    };

    // InputNumber does not declare an enter event; its keydown fires for every key
    const onQuickJumpKeydown = (event: KeyboardEvent) => {
        if (event.key === ENTER_KEY && !isComposing(event) && event.target instanceof HTMLInputElement) {
            foundation.handleQuickJumpEnterPress(event.target.value);
        }
    };

    // Only the pageSize prop itself may overwrite the page size: the size changer writes state alone, and a total change
    // must not revert that choice.
    watch(
        () => currentPage ?? globalCurrentPage,
        (page) => foundation.updatePage(page)
    );

    watch(
        () => total,
        () => foundation.updatePage(currentPage ?? globalCurrentPage)
    );

    watch(
        () => pageSize ?? globalPageSize,
        (next) => {
            // the changer's own write-back arrives equal to the state; restarting at page 1 would undo the page it recomputed
            if (next !== states().pageSize) {
                foundation.updatePage(currentPage ?? globalCurrentPage, next);
            }
        }
    );

    $effect(() => {
        warning(sizeChangerShown && hideOnSinglePage, '[Semi Pagination] You should not use showSizeChanger and hideOnSinglePage in ths same time. At this time, hideOnSinglePage no longer takes effect, otherwise there may be a problem that the switch entry disappears');
    });
</script>

{#snippet pageButton(page: number | '...', trigger?: TooltipTriggerProps)}
    <button
        {...trigger}
        aria-current={page === states().currentPage ? 'page' : undefined}
        aria-label={page === '...' ? text.more : pageLabel(page)}
        class={[
            `${prefix}-item`,
            {
                [`${prefix}-item-active`]: page === states().currentPage,
                [`${prefix}-item-all-disabled`]: disabled,
                [`${prefix}-item-all-disabled-active`]: page === states().currentPage && disabled,
            },
        ]}
        {disabled}
        type="button"
        onclick={() => foundation.goPage(page)}
    >
        {page}
    </button>
{/snippet}

{#if !hidden}
    <ul {...rest} class={[prefix, rest.class, { [`${prefix}-small`]: size === 'small', [`${prefix}-disabled`]: disabled }]}>
        {#if showTotal && size !== 'small'}
            <li class={`${prefix}-total`}>{text.total.replace('${total}', totalPageNum.toString())}</li>
        {/if}
        <li>
            <StepButton disabled={disabledState.prevDisabled || disabled} kind="prev" label={text.prev} text={prevText} onclick={foundation.goPrev} />
        </li>
        {#if size === 'small'}
            <li>
                {#if hoverShowPageSelect && !disabled}
                    <Popover>
                        {#snippet child({ props })}
                            <button {...props} class={`${prefix}-item ${prefix}-item-small`} type="button">{smallText}</button>
                        {/snippet}
                        {#snippet content()}
                            <RestPages count={totalPageNum} onSelect={foundation.goPage} start={1} />
                        {/snippet}
                    </Popover>
                {:else}
                    <div class={[`${prefix}-item`, `${prefix}-item-small`, { [`${prefix}-item-all-disabled`]: disabled }]}>
                        {smallText}
                    </div>
                {/if}
            </li>
        {:else}
            {#each pageData.pageList as page, i (page === '...' ? (i < 3 ? 'rest-left' : 'rest-right') : page)}
                <li>
                    {#if isRest(page)}
                        <Popover position={popoverPosition} trigger="hover">
                            {#snippet child({ props })}
                                {@render pageButton(page, props)}
                            {/snippet}
                            {#snippet content()}
                                <RestPages {...i < 3 ? pageData.restLeftRange : pageData.restRightRange} onSelect={foundation.goPage} />
                            {/snippet}
                        </Popover>
                    {:else}
                        {@render pageButton(page)}
                    {/if}
                </li>
            {/each}
        {/if}
        <li>
            <StepButton disabled={disabledState.nextDisabled || disabled} kind="next" label={text.next} text={nextText} onclick={foundation.goNext} />
        </li>
        {#if sizeChangerShown}
            <li class={`${prefix}-switch`}>
                <Select aria-label={text.pageSizeSelector} clickToHide {disabled} dropdownClassName={`${prefix}-select-dropdown`} onChange={changePageSize} optionList={sizeOptions} position={switchPosition} value={states().pageSize} />
            </li>
        {/if}
        {#if showQuickJumper}
            <li class={[`${prefix}-quickjump`, { [`${prefix}-quickjump-disabled`]: quickJumpDisabled }]}>
                <span>{text.jumpTo}</span>
                <InputNumber aria-label={text.jumpTo} class={`${prefix}-quickjump-input-number`} disabled={quickJumpDisabled} hideButtons onBlur={foundation.handleQuickJumpBlur} onChange={foundation.handleQuickJumpNumberChange} onKeyDown={onQuickJumpKeydown} showClear={false} value={states().quickJumpPage} />
                <span>{text.page}</span>
            </li>
        {/if}
    </ul>
{/if}
