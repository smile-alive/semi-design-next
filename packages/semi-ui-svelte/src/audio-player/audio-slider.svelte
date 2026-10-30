<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import { formatTime, getPointerRatio } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/audio-player/audio-player.scss';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import type { AudioSliderProps } from './interface.js';

    let { value = 0, max = 100, vertical = false, height = 4, showTooltip = true, theme = 'dark', label, getValueText, onChange }: AudioSliderProps = $props();

    let track = $state<HTMLDivElement>();
    let input = $state<HTMLInputElement>();
    let isDragging = $state(false);
    let movingInfo = $state<{ progress: number; offset: number } | null>(null);

    const prefix = cssClasses.PREFIX;

    // $size-audio-player-slider-dot
    const dotSize = 16;

    // the duration is 0 until the metadata loads
    const percent = $derived(max ? (value / max) * 100 : 0);

    // the popup is anchored to the slider's center, so only a translate moves it to the pointer; the vertical offset
    // counts up from the bottom
    const tooltipStyle = $derived(movingInfo ? `translate: ${vertical ? `0 ${-movingInfo.offset}px` : `${movingInfo.offset}px 0`}` : undefined);

    const onPointer = (event: MouseEvent, seek: boolean) => {
        if (!track) {
            return;
        }
        const { total, ratio } = getPointerRatio(track.getBoundingClientRect(), event, vertical);
        if (seek && isDragging) {
            onChange?.(ratio * max);
        }
        // from the slider's center to where the dot sits at this ratio, so the preview stays over the dragged dot
        movingInfo = { progress: ratio, offset: (ratio - 0.5) * total };
    };

    // the slider keeps the pointer from the press on, so the moves and the release reach it even outside it
    const onPointerDown = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
        if (isSecondaryPress(event)) {
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
        if (input) {
            focusWithoutRing(input, { preventScroll: true });
        }
        isDragging = true;
        onPointer(event, true);
    };

    // the preview belongs to the pointer; a keyboard use shows the value
    const clearPreview = () => {
        movingInfo = null;
    };

    const onFocus = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
        if (event.currentTarget.matches(':focus-visible')) {
            clearPreview();
        }
    };

    const onInput = (event: Event & { currentTarget: HTMLInputElement }) => onChange?.(Number(event.currentTarget.value));
</script>

<!-- tabindex="-1" on the wrapper stops the Tooltip adding a Tab stop: the hidden native range input is the control.
     lostpointercapture follows pointerup and pointercancel, and also fires when the slider leaves the page mid-drag.
     mousedown's default is prevented so the mouse does not move focus from the input to the wrapper.
     The input binds max before value, so a range that grows and moves in one update keeps the new value.
     The dot stays inside the track like a native range thumb. -->
{#snippet wrapper(triggerProps?: TooltipTriggerProps)}
    <div
        {...triggerProps}
        class={[
            `${prefix}-slider-wrapper`,
            {
                [`${prefix}-slider-wrapper-vertical`]: vertical,
                [`${prefix}-slider-wrapper-horizontal`]: !vertical,
                [`${prefix}-slider-wrapper-dragging`]: isDragging,
            },
        ]}
        tabindex="-1"
        onlostpointercapture={() => (isDragging = false)}
        onmousedown={(event) => event.preventDefault()}
        onmouseenter={(event) => onPointer(event, false)}
        onpointerdown={onPointerDown}
        onpointermove={(event) => onPointer(event, true)}
    >
        <input aria-label={label} aria-orientation={vertical ? 'vertical' : undefined} aria-valuetext={getValueText(value)} bind:this={input} class={`${prefix}-slider-input`} {max} min="0" step="1" type="range" {value} onfocus={onFocus} oninput={onInput} onkeydown={clearPreview} />
        <div
            bind:this={track}
            class={[
                `${prefix}-slider`,
                `${prefix}-slider-${theme}`,
                {
                    [`${prefix}-slider-vertical`]: vertical,
                    [`${prefix}-slider-horizontal`]: !vertical,
                },
            ]}
            style={vertical ? `height: ${toCssLength(height)}` : undefined}
        >
            <div
                class={[
                    `${prefix}-slider-progress`,
                    {
                        [`${prefix}-slider-progress-vertical`]: vertical,
                        [`${prefix}-slider-progress-horizontal`]: !vertical,
                    },
                ]}
                style={`height: ${vertical ? `${percent}%` : '100%'}; width: ${vertical ? '100%' : `${percent}%`}`}
            ></div>
            <div class={`${prefix}-slider-dot`} style={vertical ? `left: 50%; bottom: calc(${percent}% - ${dotSize / 2}px); transform: translateX(-50%); pointer-events: none` : `left: calc(${percent}% - ${dotSize / 2}px); top: 50%; transform: translateY(-50%); pointer-events: none`}></div>
        </div>
    </div>
{/snippet}

{#if showTooltip}
    <Tooltip autoAdjustOverflow position={vertical ? 'right' : 'top'} style={tooltipStyle}>
        {#snippet child({ props })}
            {@render wrapper(props)}
        {/snippet}
        {#snippet content()}
            {formatTime(movingInfo ? movingInfo.progress * max : value)}
        {/snippet}
    </Tooltip>
{:else}
    {@render wrapper()}
{/if}
