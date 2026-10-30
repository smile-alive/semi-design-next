<script lang="ts" generics="T = any">
    import { cssClasses } from '@fibrae/semi-foundation/list/constants';
    import '@fibrae/semi-foundation/list/list.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import { Row } from '../grid/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import Spin from '../spin/spin.svelte';
    import { setListContext } from './context.js';
    import type { ListProps } from './interface.js';

    const defaults = useDefaultProps('List');

    let {
        bordered = defaults('bordered', false),
        dataSource = defaults('dataSource') as T[] | undefined,
        grid = defaults('grid'),
        layout = defaults('layout', 'vertical'),
        loading = defaults('loading', false),
        size = defaults('size', 'default'),
        split = defaults('split', true),
        onClick = defaults('onClick'),
        onRightClick = defaults('onRightClick'),
        item,
        header,
        footer,
        emptyContent,
        loadMore,
        children,
        ...rest
    }: ListProps<T> = $props();

    const locale = useLocale('List');

    const prefixCls = cssClasses.PREFIX;
    const showEmpty = $derived(!dataSource?.length && !children);

    setListContext({
        get grid() {
            return grid;
        },
        get onClick() {
            return onClick;
        },
        get onRightClick() {
            return onRightClick;
        },
    });
</script>

{#snippet items()}
    {#each dataSource ?? [] as entry, index (index)}
        {@render item?.({ item: entry, index })}
    {/each}
    {@render children?.()}
{/snippet}

<div {...rest} class={[prefixCls, rest.class, { [`${prefixCls}-flex`]: layout === 'horizontal' }, `${prefixCls}-${size}`, { [`${prefixCls}-grid`]: grid, [`${prefixCls}-split`]: split, [`${prefixCls}-bordered`]: bordered }]} role={groupRole(rest)}>
    {#if header}
        <div class={`${prefixCls}-header`} x-semi-prop="header">{@render header()}</div>
    {/if}
    <Spin size="large" spinning={loading}>
        {#if showEmpty}
            {#if emptyContent}
                <div class={`${prefixCls}-empty`} x-semi-prop="emptyContent">{@render emptyContent()}</div>
            {:else}
                <div class={`${prefixCls}-empty`}>{locale().locale.emptyText}</div>
            {/if}
        {:else if grid}
            <Row align={grid.align} gutter={grid.gutter} justify={grid.justify} role="list" type="flex">
                {@render items()}
            </Row>
        {:else}
            <ul class={`${prefixCls}-items`}>
                {@render items()}
            </ul>
        {/if}
    </Spin>
    {#if footer}
        <div class={`${prefixCls}-footer`} x-semi-prop="footer">{@render footer()}</div>
    {/if}
    {@render loadMore?.()}
</div>
