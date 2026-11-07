<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
    import '@fibrae/semi-foundation/components/layout/layout.scss';
    import type { LayoutBasicProps } from './interface.js';

    let { prefixCls = cssClasses.PREFIX, tagName = 'header', type = 'header', children, ...rest }: LayoutBasicProps = $props();
</script>

<svelte:element this={tagName} {...rest} class={[rest.class, `${prefixCls}-${type}`]}>
    {@render children?.()}
</svelte:element>
