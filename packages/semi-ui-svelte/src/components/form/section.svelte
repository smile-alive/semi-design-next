<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import type { SectionProps } from './interface.js';

    let { text, extraText, children, ...rest }: SectionProps = $props();

    const extraId = $props.id();
</script>

<fieldset {...rest} aria-describedby={joinIds(rest['aria-describedby'], extraText && extraId)} class={[`${cssClasses.PREFIX}-section`, rest.class]}>
    <!-- an empty legend would still draw its divider -->
    {#if text}
        <legend class={`${cssClasses.PREFIX}-section-text`}>{@render text()}</legend>
    {/if}
    {#if extraText}
        <div class={`${cssClasses.PREFIX}-section-extra`} id={extraId}>{@render extraText()}</div>
    {/if}
    {@render children?.()}
</fieldset>
