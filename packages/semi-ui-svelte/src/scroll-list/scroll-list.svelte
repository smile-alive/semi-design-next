<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
    import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { ScrollListProps } from './interface.js';

    const defaults = useDefaultProps('ScrollList');
    let { bodyHeight = defaults('bodyHeight'), footer = defaults('footer'), header = defaults('header'), children, ...rest }: ScrollListProps = $props();

    const prefix = cssClasses.PREFIX;

    // 0 leaves the stylesheet height, as in the other frameworks
    // Named apart from `height`: the formatter folds `style:height={height}` into the shorthand, whose server output
    // (svelte 5.57) reads the derived itself instead of its value; upgrade condition: the compiler unwraps it
    const cssHeight = $derived(typeof bodyHeight === 'number' ? (bodyHeight ? `${bodyHeight}px` : undefined) : bodyHeight || undefined);
</script>

<div {...rest} class={[prefix, rest.class]} role={groupRole(rest)}>
    {#if header}
        <div class={`${prefix}-header`}>
            <div class={`${prefix}-header-title`} x-semi-prop="header">
                {#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
            </div>
            <div class={`${prefix}-line`}></div>
        </div>
    {/if}
    <div class={`${prefix}-body`} style:height={cssHeight} x-semi-prop="children">
        {@render children?.()}
    </div>
    {#if footer}
        <div class={`${prefix}-footer`} x-semi-prop="footer">
            {#if typeof footer === 'string'}{footer}{:else}{@render footer()}{/if}
        </div>
    {/if}
</div>
