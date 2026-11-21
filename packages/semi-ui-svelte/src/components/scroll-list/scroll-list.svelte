<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { ScrollListProps } from './interface.js';

    const defaults = useDefaultProps('ScrollList');
    let { bodyHeight = defaults('bodyHeight'), classNames = defaults('classNames'), footer = defaults('footer'), header = defaults('header'), styles = defaults('styles'), children, ...rest }: ScrollListProps = $props();

    const prefix = cssClasses.PREFIX;

    // 0 leaves the stylesheet height, as in the other frameworks. One style string, not a `style:height` directive,
    // which would win over a height in styles.body
    const cssHeight = $derived(typeof bodyHeight === 'number' ? (bodyHeight ? `${bodyHeight}px` : undefined) : bodyHeight || undefined);
    const bodyStyle = $derived([cssHeight && `height: ${cssHeight}`, styles?.body].filter(Boolean).join('; '));
</script>

<div {...rest} class={[prefix, rest.class]} role={namedRole(rest)}>
    {#if header}
        <div class={[`${prefix}-header`, classNames?.header]} style={styles?.header}>
            <div class={[`${prefix}-header-title`, classNames?.title]} style={styles?.title} x-semi-prop="header">
                {#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
            </div>
            <div class={`${prefix}-line`}></div>
        </div>
    {/if}
    <div class={[`${prefix}-body`, classNames?.body]} style={bodyStyle || undefined} x-semi-prop="children">
        {@render children?.()}
    </div>
    {#if footer}
        <div class={[`${prefix}-footer`, classNames?.footer]} style={styles?.footer} x-semi-prop="footer">
            {#if typeof footer === 'string'}{footer}{:else}{@render footer()}{/if}
        </div>
    {/if}
</div>
