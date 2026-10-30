<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import type { LayoutBasicProps } from './interface.js';

    let { prefixCls = cssClasses.PREFIX, tagName = 'footer', type = 'footer', children, ...rest }: LayoutBasicProps = $props();
</script>

<svelte:element this={tagName} {...rest} class={[rest.class, `${prefixCls}-${type}`]}>
    {@render children?.()}
</svelte:element>
