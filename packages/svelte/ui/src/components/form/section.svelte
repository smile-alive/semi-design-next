<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import type { SectionProps } from './interface.js';

    let { text, children, ...rest }: SectionProps = $props();
</script>

<fieldset {...rest} class={[`${cssClasses.PREFIX}-section`, rest.class]}>
    <!-- an empty legend would still draw its divider -->
    {#if text}
        <legend class={`${cssClasses.PREFIX}-section-text`}>{@render text()}</legend>
    {/if}
    {@render children?.()}
</fieldset>
