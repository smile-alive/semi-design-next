<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/video-player/constants';
    import VideoProgressFoundation, { type VideoProgressAdapter, type VideoProgressBaseProps, type VideoProgressBaseState } from '@fibrae/semi-foundation/components/video-player/progress-foundation';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/components/video-player/utils';
    import '@fibrae/semi-foundation/components/video-player/video-player.scss';
    import { useFoundation } from '../../base/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import type { VideoProgressProps } from './interface.js';

    type Foundation = VideoProgressFoundation<VideoProgressBaseProps>;
    type Adapter = VideoProgressAdapter<VideoProgressBaseProps>;

    let { value, max, step, bufferedValue, markers, showTooltip = true, onChange }: VideoProgressProps = $props();

    const locale = useLocale('VideoPlayer');

    let slider = $state<HTMLDivElement>();

    const prefix = cssClasses.PREFIX_PROGRESS;
    const markersList = $derived(VideoProgressFoundation.getMarkersList(markers, max));

    const foundationProps: VideoProgressBaseProps = {
        get max() {
            return max;
        },
        get value() {
            return value;
        },
        get step() {
            return step;
        },
        get markers() {
            return markers;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, VideoProgressBaseProps, VideoProgressBaseState>(
        VideoProgressFoundation,
        foundationProps,
        () => VideoProgressFoundation.getInitialState(),
        () => ({
            getSliderRef: () => slider ?? null,
            notifyChange: (next) => onChange?.(next),
        })
    );

    const texts = $derived(locale().locale);
    const movingInfo = $derived(states().movingInfo);
    const previewValue = $derived(movingInfo?.value ?? value);
    const tooltipStyle = $derived(movingInfo ? `translate: ${VideoProgressFoundation.getPreviewTranslate(movingInfo.offset)}` : undefined);
</script>

{#snippet bar(triggerProps?: TooltipTriggerProps)}
    <div
        bind:this={slider}
        {...triggerProps}
        aria-label={texts.progress}
        aria-valuemax={max}
        aria-valuemin="0"
        aria-valuenow={value}
        aria-valuetext={`${formatTimeText(value, texts)} / ${formatTimeText(max, texts)}`}
        class={[prefix, { [`${prefix}-dragging`]: states().isDragging }]}
        role="slider"
        tabindex="0"
        onfocus={foundation.handleFocus}
        onkeydown={foundation.handleKeyDown}
        onlostpointercapture={foundation.handleLostPointerCapture}
        onmouseenter={foundation.handlePointerEnter}
        onpointerdown={foundation.handlePointerDown}
        onpointermove={foundation.handlePointerMove}
    >
        <div class={`${prefix}-markers`}>
            {#each markersList as marker, index (`${marker.start}-${index}`)}
                <div class={[`${prefix}-slider`, { [`${prefix}-slider-active`]: index === states().activeIndex && states().isDragging }]} style={`left: ${marker.left}; width: ${marker.width}`}>
                    <div class={`${prefix}-slider-list`}></div>
                    <div class={`${prefix}-slider-buffered`} style={`width: ${VideoProgressFoundation.getValueWidth(marker, bufferedValue)}`}></div>
                    <div class={`${prefix}-slider-played`} style={`width: ${VideoProgressFoundation.getValueWidth(marker, value)}`}></div>
                </div>
            {/each}
        </div>
        <div class={`${prefix}-handle`} style={`left: ${VideoProgressFoundation.getHandleLeft(value, max)}`}></div>
    </div>
{/snippet}

{#if showTooltip}
    <Tooltip class={`${prefix}-tooltip`} position="top" spacing={2} style={tooltipStyle}>
        {#snippet child({ props })}
            {@render bar(props)}
        {/snippet}
        {#snippet content()}
            {#if markersList.length > 0}
                <div class={`${prefix}-tooltip-content`}>{VideoProgressFoundation.getMarkerTitle(markersList, previewValue)}</div>
                <div class={`${prefix}-tooltip-content`}>{formatTime(previewValue)}</div>
            {:else}
                {formatTime(previewValue)}
            {/if}
        {/snippet}
    </Tooltip>
{:else}
    {@render bar()}
{/if}
