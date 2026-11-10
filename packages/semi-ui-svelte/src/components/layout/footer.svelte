<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/layout/constants';
    import '@fibrae/semi-foundation/components/layout/layout.scss';
    import type { LayoutBasicProps } from './interface.js';

    let { tagName = 'footer', children, ...rest }: LayoutBasicProps = $props();

    const prefixCls = cssClasses.PREFIX;
</script>

<svelte:element this={tagName} {...rest} class={[rest.class, `${prefixCls}-footer`]}>
    {@render children?.()}
</svelte:element>
