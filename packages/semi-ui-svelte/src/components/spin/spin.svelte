<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/spin/constants';
    import SpinFoundation, { type SpinAdapter, type SpinState } from '@fibrae/semi-foundation/components/spin/foundation';
    import '@fibrae/semi-foundation/components/spin/spin.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { watch } from '../../hooks/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import SpinIcon from './icon.svelte';
    import type { SpinProps } from './interface.js';

    type Foundation = SpinFoundation<SpinProps>;
    type Adapter = SpinAdapter<SpinProps>;

    const defaults = useDefaultProps('Spin');
    let { size = defaults('size', 'middle'), spinning = defaults('spinning', true), delay = defaults('delay', 0), wrapperClassName = defaults('wrapperClassName'), childStyle = defaults('childStyle'), indicator = defaults('indicator'), tip = defaults('tip'), children, ...rest }: SpinProps = $props();

    const locale = useLocale('Spin');

    let root = $state<HTMLDivElement>();

    const { foundation, states } = useFoundation<Foundation, Adapter, SpinProps, SpinState>(
        SpinFoundation,
        {
            get delay() {
                return delay;
            },
            get spinning() {
                return spinning;
            },
        },
        (view) => SpinFoundation.getInitialState(view),
        () => ({})
    );

    const prefixCls = cssClasses.PREFIX;
    const loading = $derived(delay ? states().loading : spinning);
    const blocked = $derived(Boolean(loading && children));

    watch(
        () => blocked,
        (value) => foundation.handleBlockedChange(root!, value)
    );
</script>

<div
    bind:this={root}
    {...rest}
    aria-busy={blocked ? true : undefined}
    class={[
        prefixCls,
        wrapperClassName,
        rest.class,
        {
            [`${prefixCls}-${size}`]: size,
            [`${prefixCls}-block`]: children,
            [`${prefixCls}-hidden`]: !loading,
        },
    ]}
    tabindex={blocked ? -1 : undefined}
>
    {#if loading}
        <output aria-label={locale().locale.loading} class={`${prefixCls}-wrapper`}>
            {#if indicator}
                <div class={`${prefixCls}-animate`} x-semi-prop="indicator">{@render indicator()}</div>
            {:else}
                <SpinIcon />
            {/if}
            {#if tip}
                <div x-semi-prop="tip">{@render tip()}</div>
            {/if}
        </output>
    {/if}
    <div class={`${prefixCls}-children`} inert={blocked} style={childStyle} x-semi-prop="children">
        {@render children?.()}
    </div>
</div>
