<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/card/constants';
    import '@fibrae/semi-foundation/components/card/card.scss';
    import type { MetaProps } from './interface.js';

    // A static subcomponent: it reads no global defaults, as in React.
    const { classNames, styles, title, avatar, description, ...rest }: MetaProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const hasTitle = $derived(typeof title === 'function' || Boolean(title));
</script>

<div {...rest} class={[`${prefixCls}-meta`, rest.class]}>
    {#if avatar}
        <div class={[`${prefixCls}-meta-avatar`, classNames?.avatar]} style={styles?.avatar}>{@render avatar()}</div>
    {/if}
    {#if hasTitle || description}
        <div class={[`${prefixCls}-meta-wrapper`, classNames?.section]} style={styles?.section}>
            {#if hasTitle}
                <div class={[`${prefixCls}-meta-wrapper-title`, classNames?.title]} style={styles?.title}>
                    {#if typeof title === 'function'}
                        {@render title()}
                    {:else}
                        {title}
                    {/if}
                </div>
            {/if}
            {#if description}
                <div class={[`${prefixCls}-meta-wrapper-description`, classNames?.description]} style={styles?.description}>{@render description()}</div>
            {/if}
        </div>
    {/if}
</div>
