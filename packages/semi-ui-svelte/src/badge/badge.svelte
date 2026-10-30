<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/badge/constants';
    import '@fibrae/semi-foundation/badge/badge.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import { getConfigContext } from '../config-provider/context.js';
    import type { BadgeProps } from './interface.js';

    const defaults = useDefaultProps('Badge');

    let {
        count = defaults('count'),
        dot = defaults('dot', false),
        type = defaults('type', 'primary'),
        theme = defaults('theme', 'solid'),
        position = defaults('position'),
        overflowCount = defaults('overflowCount'),
        countClassName = defaults('countClassName'),
        countStyle = defaults('countStyle'),
        children,
        ...rest
    }: BadgeProps = $props();

    const config = getConfigContext();

    const prefixCls = cssClasses.PREFIX;
    const place = $derived(position ?? (config.direction === 'rtl' ? 'leftTop' : 'rightTop'));
    const custom = $derived(typeof count === 'function' ? count : undefined);

    // An overflowCount of 0 means unset, and only numbers overflow: a string count is shown as given
    const content = $derived(typeof count === 'number' && overflowCount && overflowCount < count ? `${overflowCount}+` : count);
</script>

<span {...rest} class={[prefixCls, rest.class]}>
    {@render children?.()}
    <span
        class={[
            countClassName,
            {
                [`${prefixCls}-${type}`]: !custom,
                [`${prefixCls}-${theme}`]: !custom,
                [`${prefixCls}-${place}`]: children,
                [`${prefixCls}-block`]: !children,
                [`${prefixCls}-dot`]: dot,
                [`${prefixCls}-count`]: !dot && !custom && count != null,
                [`${prefixCls}-custom`]: custom,
            },
        ]}
        style={countStyle}
        x-semi-prop="count"
    >
        {#if !dot}
            {#if custom}
                {@render custom()}
            {:else}
                {content}
            {/if}
        {/if}
    </span>
</span>
