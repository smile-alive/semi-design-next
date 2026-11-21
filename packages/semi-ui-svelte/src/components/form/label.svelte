<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { IconHelpCircleStroked } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import { getFormContext } from './context.js';
    import type { LabelProps } from './interface.js';

    let { text, align = 'left', disabled, required = false, optional = false, name, width, children, extra, tooltip, classNames, styles, ...rest }: LabelProps = $props();

    const locale = useLocale('Form');

    const form = getFormContext()?.formProps;
    const prefix = `${cssClasses.PREFIX}-field-label`;
    const hasExtra = $derived(Boolean(extra));
    const hasTooltip = $derived(tooltip !== undefined && tooltip !== '');
</script>

{#snippet labelView()}
    <label
        {...rest}
        class={[form?.classNames?.label, prefix, rest.class, { [`${prefix}-left`]: align === 'left', [`${prefix}-right`]: align === 'right', [`${prefix}-required`]: required && !optional, [`${prefix}-disabled`]: disabled, [`${prefix}-with-extra`]: hasExtra }]}
        for={name || rest.for || undefined}
        style={[form?.styles?.label, rest.style, width !== undefined && !hasTooltip && `width: ${toCssLength(width)}`].filter(Boolean).join(';') || undefined}
    >
        <div class={[`${prefix}-text`, form?.classNames?.labelText, classNames?.text]} style={[form?.styles?.labelText, styles?.text].filter(Boolean).join(';') || undefined} x-semi-prop="label">
            {#if children}{@render children()}{:else}{text}{/if}{#if optional}<span class={`${prefix}-optional-text`}>{locale().locale.optional}</span>{/if}
        </div>
        {#if hasExtra}
            <div class={[`${prefix}-extra`, form?.classNames?.labelExtra, classNames?.extra]} style={[form?.styles?.labelExtra, styles?.extra].filter(Boolean).join(';') || undefined}>{@render extra?.()}</div>
        {/if}
    </label>
{/snippet}

{#snippet tooltipButton(triggerProps: Partial<TooltipTriggerProps>)}
    <button {...triggerProps} aria-label={locale().locale.labelTooltip} class={[`${prefix}-tooltip`, form?.classNames?.labelTooltip, classNames?.tooltip]} style={[form?.styles?.labelTooltip, styles?.tooltip].filter(Boolean).join(';') || undefined} type="button">
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
