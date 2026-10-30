<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { SectionProps } from './interface.js';

    let { text, children, ...rest }: SectionProps = $props();
</script>

<section {...rest} class={[`${cssClasses.PREFIX}-section`, rest.class]}>
    <!-- an empty heading would still be announced as one -->
    {#if text}
        <h5 class={`${cssClasses.PREFIX}-section-text`}>{@render text()}</h5>
    {/if}
    {@render children?.()}
</section>
