<script lang="ts">
    import { onDestroy } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-foundation/progress/constants';
    import { generateColor } from '@fibrae/semi-foundation/progress/generates';
    import { calcCircleGeometry, calcPercent, createPercentAnimation } from '@fibrae/semi-foundation/progress/utils';
    import '@fibrae/semi-foundation/progress/progress.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import watch from '../_base/watch.svelte.js';
    import type { ProgressProps } from './interface.js';

    const defaults = useDefaultProps('Progress');

    let {
        direction = defaults('direction', 'horizontal'),
        indeterminate = defaults('indeterminate', false),
        motion = defaults('motion', true),
        orbitStroke = defaults('orbitStroke'),
        percent = defaults('percent', 0),
        showInfo = defaults('showInfo', false),
        size = defaults('size', 'default'),
        stroke = defaults('stroke'),
        strokeGradient = defaults('strokeGradient', false),
        strokeLinecap = defaults('strokeLinecap', 'round'),
        strokeWidth = defaults('strokeWidth', 4),
        type = defaults('type', 'line'),
        width = defaults('width'),
        format,
        ...rest
    }: ProgressProps = $props();

    // The number shown in the text, animated towards `percent`; aria-valuenow and the fill read the target
    let shown = $state(percent);

    const prefixCls = cssClasses.PREFIX;

    const animation = createPercentAnimation((value) => {
        shown = value;
    });

    const perc = $derived(calcPercent(percent));
    const percNumber = $derived(calcPercent(shown));
    const strokeColor = $derived(Array.isArray(stroke) ? generateColor(stroke, perc, strokeGradient) : stroke);
    const horizontal = $derived(direction === strings.DEFAULT_DIRECTION);

    // The indeterminate block is moved by a CSS animation, so no width or height is written and percent is ignored.
    const innerStyle = $derived.by(() => {
        if (indeterminate) return `background: ${strokeColor};`;
        return `background: ${strokeColor}; ${horizontal ? 'width' : 'height'}: ${perc}%;`;
    });

    const diameter = $derived(width || (size === 'small' ? 24 : 72));
    const geometry = $derived(calcCircleGeometry(diameter, strokeWidth, perc, indeterminate));

    watch(
        () => percent,
        // `previous` only feeds the NaN check, and a NaN previous would have thrown on the update before
        (next) => animation.update(next, next, shown, motion)
    );

    onDestroy(animation.stop);
</script>

{#snippet text()}
    {#if format}{@render format({ percent: percNumber })}{:else}{percNumber}%{/if}
{/snippet}

{#if type === 'line'}
    <div
        {...rest}
        aria-valuemax="100"
        aria-valuemin="0"
        aria-valuenow={indeterminate ? undefined : perc}
        class={[
            prefixCls,
            rest.class,
            horizontal ? `${prefixCls}-horizontal` : `${prefixCls}-vertical`,
            {
                [`${prefixCls}-large`]: size === 'large',
                [`${prefixCls}-indeterminate`]: indeterminate,
            },
        ]}
        role="progressbar"
    >
        <div aria-hidden="true" class={`${prefixCls}-track`} style={orbitStroke ? `background-color: ${orbitStroke};` : undefined}>
            <div aria-hidden="true" class={[`${prefixCls}-track-inner`, { [`${prefixCls}-track-inner-indeterminate`]: indeterminate }]} style={innerStyle}></div>
        </div>
        {#if showInfo && !indeterminate}
            <div class={`${prefixCls}-line-text`}>{@render text()}</div>
        {/if}
    </div>
{:else}
    <div {...rest} aria-valuemax="100" aria-valuemin="0" aria-valuenow={indeterminate ? undefined : perc} class={[`${prefixCls}-circle`, rest.class]} role="progressbar">
        {#key size}
            <svg aria-hidden="true" class={`${prefixCls}-circle-ring`} height={diameter} width={diameter}>
                <circle
                    aria-hidden="true"
                    class={`${prefixCls}-circle-ring-track`}
                    cx={geometry.center}
                    cy={geometry.center}
                    fill="transparent"
                    r={geometry.radius}
                    stroke-dasharray={`${geometry.circumference} ${geometry.circumference}`}
                    stroke-dashoffset="0"
                    stroke-linecap={strokeLinecap}
                    stroke-width={strokeWidth}
                    style:stroke={orbitStroke}
                />
                <circle
                    aria-hidden="true"
                    class={[`${prefixCls}-circle-ring-inner`, { [`${prefixCls}-circle-ring-inner-indeterminate`]: indeterminate }]}
                    cx={geometry.center}
                    cy={geometry.center}
                    fill="transparent"
                    r={geometry.radius}
                    stroke-dasharray={geometry.strokeDasharray}
                    stroke-dashoffset={geometry.strokeDashoffset}
                    stroke-linecap={strokeLinecap}
                    stroke-width={strokeWidth}
                    style:stroke={strokeColor}
                />
            </svg>
        {/key}
        {#if showInfo && size !== 'small' && !indeterminate}
            <span class={`${prefixCls}-circle-text`}>{@render text()}</span>
        {/if}
    </div>
{/if}
