<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
    import VideoProgressFoundation, { type VideoProgressAdapter, type VideoProgressBaseProps } from '@fibrae/semi-foundation/video-player/progress-foundation';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/video-player/video-player.scss';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import type { VideoProgressProps, VideoProgressState } from './interface.js';

    type Foundation = VideoProgressFoundation<VideoProgressBaseProps, VideoProgressState>;
    type Adapter = VideoProgressAdapter<VideoProgressBaseProps, VideoProgressState>;

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
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, VideoProgressBaseProps, VideoProgressState>(
        VideoProgressFoundation,
        foundationProps,
        () => ({
            isDragging: false,
            movingInfo: null,
            activeIndex: -1,
        }),
        (base) => ({
            getSliderRef: () => slider ?? null,
            getMarkersList: () => markersList,
            setIsDragging: (isDragging) => base.setState({ isDragging }),
            setActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setMovingInfo: (movingInfo) => base.setState({ movingInfo }),
            notifyChange: (next) => onChange?.(next),
        })
    );

    const texts = $derived(locale().locale);

    // the pointer's position, or the playhead when the bar is used by keyboard
    const previewValue = $derived(states().movingInfo?.value ?? value);

    // The popup is anchored to the bar's center, so only a translate moves it to the pointer
    const tooltipStyle = $derived(states().movingInfo ? `translate: ${states().movingInfo?.offset}px 0` : undefined);
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
        onmouseenter={(event) => foundation.handlePointerPosition(event, { seek: false })}
        onpointerdown={foundation.handlePointerDown}
        onpointermove={(event) => foundation.handlePointerPosition(event, { seek: true })}
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
