<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-svelte';
    import { Slider } from '../slider/index.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import type { FooterButtonName, FooterItemName, FooterView } from './footer.js';

    let { item, view }: { item: FooterItemName; view: FooterView } = $props();

    const prefixCls = cssClasses.PREFIX;
    const footerCls = `${prefixCls}-preview-footer`;

    const icons = {
        prev: IconChevronLeft,
        next: IconChevronRight,
        zoomOut: IconMinus,
        zoomIn: IconPlus,
        rotate: IconRotate,
        download: IconDownload,
    };

    const iconOf = (name: FooterButtonName) => {
        if (name === 'ratio') {
            return view.ratio === 'adaptation' ? IconRealSizeStroked : IconWindowAdaptionStroked;
        }
        return icons[name];
    };

    const toPercentText = (value: number) => `${value}%`;
</script>

<!-- disabled stays focusable (aria-disabled) so focus is not lost at the last image or zoom limit -->
{#snippet button(name: FooterButtonName, props?: TooltipTriggerProps)}
    {@const data = view.buttons[name]}
    {@const Icon = iconOf(name)}
    <button {...props} aria-disabled={data.disabled || undefined} aria-label={data.label} class={[`${footerCls}-button`, { [`${prefixCls}-tooltip-children-wrapper`]: view.showTooltip, [`${footerCls}-gap`]: name === 'ratio' || name === 'download' }]} type="button" onclick={() => !data.disabled && data.onClick()}>
        <Icon class={{ [`${footerCls}-disabled`]: data.disabled }} size="large" />
    </button>
{/snippet}

{#if item === 'page'}
    <div aria-atomic="true" aria-live="polite" class="{footerCls}-page">{view.curPage}/{view.totalNum}</div>
{:else if item === 'slider'}
    <Slider aria-label={view.zoomLabel} bind:value={() => view.zoom, () => {}} getAriaValueText={toPercentText} max={view.max} min={view.min} onChange={view.onSlide} step={view.step} tipFormatter={toPercentText} tooltipVisible={view.showTooltip ? undefined : false} />
{:else if view.showTooltip}
    <Tooltip>
        {#snippet child({ props })}
            {@render button(item, props)}
        {/snippet}
        {#snippet content()}
            {view.buttons[item].label}
        {/snippet}
    </Tooltip>
{:else}
    {@render button(item)}
{/if}
