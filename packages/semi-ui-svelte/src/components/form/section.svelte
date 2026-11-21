<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { joinIds } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import type { SectionProps } from './interface.js';

    let { text, extraText, children, classNames, styles, ...rest }: SectionProps = $props();

    const extraId = $props.id();
</script>

<fieldset {...rest} aria-describedby={joinIds(rest['aria-describedby'], extraText && extraId)} class={[`${cssClasses.PREFIX}-section`, rest.class]}>
    <!-- an empty legend would still draw its divider -->
    {#if text}
        <legend class={[`${cssClasses.PREFIX}-section-text`, classNames?.title]} style={styles?.title}>{@render text()}</legend>
    {/if}
    {#if extraText}
        <div class={[`${cssClasses.PREFIX}-section-extra`, classNames?.extra]} id={extraId} style={styles?.extra}>{@render extraText()}</div>
    {/if}
    {@render children?.()}
</fieldset>
