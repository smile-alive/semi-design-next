<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { IconHelpCircleStroked } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import type { LabelProps } from './interface.js';

    let { text, align = 'left', disabled, required = false, optional = false, name, width, children, extra, tooltip, ...rest }: LabelProps = $props();

    const locale = useLocale('Form');

    const prefix = `${cssClasses.PREFIX}-field-label`;
    const hasExtra = $derived(Boolean(extra));
    const hasTooltip = $derived(tooltip !== undefined && tooltip !== '');
</script>

{#snippet labelView()}
    <label
        {...rest}
        class={[prefix, rest.class, { [`${prefix}-left`]: align === 'left', [`${prefix}-right`]: align === 'right', [`${prefix}-required`]: required && !optional, [`${prefix}-disabled`]: disabled, [`${prefix}-with-extra`]: hasExtra }]}
        for={name || rest.for || undefined}
        style={[rest.style, width !== undefined && !hasTooltip && `width: ${toCssLength(width)}`].filter(Boolean).join(';') || undefined}
    >
        <div class={`${prefix}-text`} x-semi-prop="label">
            {#if children}{@render children()}{:else}{text}{/if}{#if optional}<span class={`${prefix}-optional-text`}>{locale().locale.optional}</span>{/if}
        </div>
        {#if hasExtra}
            <div class={`${prefix}-extra`}>{@render extra?.()}</div>
        {/if}
    </label>
{/snippet}

{#snippet tooltipButton(triggerProps: Partial<TooltipTriggerProps>)}
    <button {...triggerProps} aria-label={locale().locale.labelTooltip} class={`${prefix}-tooltip`} type="button">
        <IconHelpCircleStroked size="inherit" />
    </button>
{/snippet}

{#if hasTooltip}
    <div class={`${prefix}-with-tooltip`} style:width={toCssLength(width)}>
        {@render labelView()}
        <Tooltip>
            {#snippet child({ props })}{@render tooltipButton(props)}{/snippet}
            {#snippet content()}{#if typeof tooltip === 'function'}{@render tooltip()}{:else}{tooltip}{/if}{/snippet}
        </Tooltip>
    </div>
{:else}
    {@render labelView()}
{/if}
