<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
    import '@fibrae/semi-foundation/skeleton/skeleton.scss';
    import type { SkeletonParagraphProps } from './interface.js';

    let { prefixCls = cssClasses.PREFIX, rows = 4, ...rest }: SkeletonParagraphProps = $props();

    // Array.from rounds a fractional count and yields no rows for NaN or a negative number
    const items = $derived(Array.from({ length: rows }, (_, index) => index));
</script>

<ul {...rest} aria-hidden={rest['aria-hidden'] ?? 'true'} class={[`${prefixCls}-paragraph`, rest.class]}>
    {#each items as item (item)}
        <li></li>
    {/each}
</ul>
