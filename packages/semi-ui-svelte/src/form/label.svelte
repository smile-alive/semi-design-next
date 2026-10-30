<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/form/form.scss';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { LabelProps } from './interface.js';

    let { text, align = 'left', disabled, required = false, optional = false, name, width, children, extra, ...rest }: LabelProps = $props();

    const locale = useLocale('Form');

    const prefix = `${cssClasses.PREFIX}-field-label`;
    const hasExtra = $derived(Boolean(extra));
</script>

<label
    {...rest}
    class={[prefix, rest.class, { [`${prefix}-left`]: align === 'left', [`${prefix}-right`]: align === 'right', [`${prefix}-required`]: required && !optional, [`${prefix}-disabled`]: disabled, [`${prefix}-with-extra`]: hasExtra }]}
    for={name || rest.for || undefined}
    style={[rest.style, width !== undefined && `width: ${toCssLength(width)}`].filter(Boolean).join(';') || undefined}
>
    <div class={`${prefix}-text`} x-semi-prop="label">
        {#if children}{@render children()}{:else}{text}{/if}{#if optional}<span class={`${prefix}-optional-text`}>{locale().locale.optional}</span>{/if}
    </div>
    {#if hasExtra}
        <div class={`${prefix}-extra`}>{@render extra?.()}</div>
    {/if}
</label>
