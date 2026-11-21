<script lang="ts">
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/list/constants';
    import '@fibrae/semi-foundation/components/list/list.scss';
    import { isAriaKey, splitControlAttrs } from '../../utils/index.js';
    import { Col } from '../grid/index.js';
    import { getListContext } from './context.js';
    import type { ListItemProps } from './interface.js';

    let { align = 'flex-start', classNames, styles, onClick, onRightClick, header, main, extra, children, ...rest }: ListItemProps = $props();

    const list = getListContext();

    const prefixCls = cssClasses.PREFIX;
    const handleClick = $derived(onClick ?? list?.onClick);
    const handleRightClick = $derived(onRightClick ?? list?.onRightClick);
    const clickable = $derived(Boolean(handleClick || handleRightClick));
    const hasBody = $derived(Boolean(header || main));
    const box = $derived(clickable ? 'span' : 'div');

    // The button is the only tab stop, so tabindex, aria-* and attachments belong there, not on the li
    const attrs = $derived(clickable ? splitControlAttrs(rest, (key) => key === 'tabindex' || isAriaKey(key)) : { root: rest, control: {} });

    // Grid's own class and style go to the Col; the Row-level props went to the Row
    const colProps = $derived(list?.grid && omit(list.grid, ['gutter', 'justify', 'align']));

    const joinStyle = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join('; ') || undefined;

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
        {#if header}<svelte:element this={box} class={[`${prefixCls}-item-body-header`, list?.classNames?.itemHeader, classNames?.header]} style={joinStyle(list?.styles?.itemHeader, styles?.header)}>{@render header()}</svelte:element>{/if}{#if main}<svelte:element
                this={box}
                class={[`${prefixCls}-item-body-main`, list?.classNames?.itemMain, classNames?.main]}
                style={joinStyle(list?.styles?.itemMain, styles?.main)}>{@render main()}</svelte:element
            >{/if}
    </svelte:element>
{/snippet}

{#snippet li()}
    <li {...attrs.root} class={[`${prefixCls}-item`, list?.classNames?.item, rest.class, { [`${prefixCls}-item-clickable`]: clickable }]} style={joinStyle(list?.styles?.item, rest.style)} onclick={clickable ? handleLiClick : undefined} oncontextmenu={clickable ? handleRightClick : undefined}>
        {#if clickable}
            <button {...attrs.control} class={`${prefixCls}-item-button`} type="button">
                {#if hasBody}{@render body()}{:else}{@render children?.()}{/if}
            </button>
        {:else if hasBody}{@render body()}{/if}{#if !clickable || hasBody}{@render children?.()}{/if}{#if extra}
            <div class={[`${prefixCls}-item-extra`, list?.classNames?.itemExtra, classNames?.extra]} style={joinStyle(list?.styles?.itemExtra, styles?.extra)}>{@render extra()}</div>
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
