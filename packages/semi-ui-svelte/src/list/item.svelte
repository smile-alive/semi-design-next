<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/list/constants';
    import '@fibrae/semi-foundation/list/list.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { Col } from '../grid/index.js';
    import { getListContext } from './context.js';
    import type { ListItemProps } from './interface.js';

    let { align = 'flex-start', onClick, onRightClick, header, main, extra, children, ...rest }: ListItemProps = $props();

    const list = getListContext();

    const prefixCls = cssClasses.PREFIX;
    const handleClick = $derived(onClick ?? list?.onClick);
    const handleRightClick = $derived(onRightClick ?? list?.onRightClick);
    const clickable = $derived(Boolean(handleClick || handleRightClick));
    const hasBody = $derived(Boolean(header || main));
    const box = $derived(clickable ? 'span' : 'div');

    // The button is the only tab stop, so tabindex, aria-* and attachments belong there, not on the li
    const attrs = $derived(clickable ? splitControlAttrs(rest, (key) => key === 'tabindex' || key.startsWith('aria-')) : { root: rest, control: {} });

    // Grid's own class and style go to the Col; the Row-level props went to the Row
    const colProps = $derived(list?.grid && omit(list.grid, ['gutter', 'justify', 'type', 'align']));

    const handleLiClick = (event: MouseEvent & { currentTarget: HTMLLIElement }) => {
        if (!handleClick) {
            return;
        }
        // :scope > keeps a nested List's extra from being taken for this item's
        const ownExtra = event.currentTarget.querySelector(`:scope > .${prefixCls}-item-extra`);
        if (event.target instanceof Node && ownExtra?.contains(event.target)) {
            return;
        }
        handleClick(event);
    };
</script>

<!-- No whitespace between the blocks of the li: it would become text between its children. A button holds phrasing content only, so its body is made of spans. -->
{#snippet body()}
    <svelte:element this={box} class={[`${prefixCls}-item-body`, `${prefixCls}-item-body-${align}`]}>
        {#if header}<svelte:element this={box} class={`${prefixCls}-item-body-header`}>{@render header()}</svelte:element>{/if}{#if main}<svelte:element this={box} class={`${prefixCls}-item-body-main`}>{@render main()}</svelte:element>{/if}
    </svelte:element>
{/snippet}

{#snippet li()}
    <li {...attrs.root} class={[`${prefixCls}-item`, rest.class, { [`${prefixCls}-item-clickable`]: clickable }]} onclick={clickable ? handleLiClick : undefined} oncontextmenu={clickable ? handleRightClick : undefined}>
        {#if clickable}
            <button {...attrs.control} class={`${prefixCls}-item-button`} type="button">
                {#if hasBody}{@render body()}{:else}{@render children?.()}{/if}
            </button>
        {:else if hasBody}{@render body()}{/if}{#if !clickable || hasBody}{@render children?.()}{/if}{#if extra}
            <div class={`${prefixCls}-item-extra`}>{@render extra()}</div>
        {/if}
    </li>
{/snippet}

{#if colProps}
    <Col {...colProps} role="none">
        {@render li()}
    </Col>
{:else}
    {@render li()}
{/if}
