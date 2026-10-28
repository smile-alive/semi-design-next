<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
    import { formatTime, getPointerRatio } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/audio-player/audio-player.scss';
    import SlotFragment from '../_base/slot-fragment';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { AudioSliderEmits, AudioSliderProps } from './interface';

    const props = withDefaults(defineProps<AudioSliderProps>(), {
        value: 0,
        max: 100,
        vertical: false,
        height: 4,
        showTooltip: true,
        theme: 'dark',
    });

    const emit = defineEmits<AudioSliderEmits>();

    const track = useTemplateRef('track');
    const input = useTemplateRef('input');
    const isDragging = shallowRef(false);
    const movingInfo = shallowRef<{ progress: number; offset: number } | null>(null);

    const prefix = cssClasses.PREFIX;

    // $size-audio-player-slider-dot
    const dotSize = 16;

    // the duration is 0 until the metadata loads
    const percent = computed(() => (props.max ? (props.value / props.max) * 100 : 0));

    // Template notes, kept here because a template comment would become an extra node in the Tooltip's trigger slot:
    // - tabindex="-1" on the wrapper stops the Tooltip adding a Tab stop; the hidden native range input is the control;
    // - lostpointercapture follows pointerup and pointercancel, and also fires when the slider leaves the page mid-drag;
    // - mousedown.prevent keeps the mouse from moving focus from the input to the wrapper;
    // - the input binds max before value, so a range that grows and moves in one update keeps the new value;
    // - the dot stays inside the track like a native range thumb.

    const onPointer = (e: MouseEvent, seek: boolean) => {
        if (!track.value) return;
        const { total, ratio } = getPointerRatio(track.value.getBoundingClientRect(), e, props.vertical);
        if (seek && isDragging.value) {
            emit('change', ratio * props.max);
        }
        // from the slider's center to where the dot sits at this ratio, so the preview stays over the dragged dot
        movingInfo.value = { progress: ratio, offset: (ratio - 0.5) * total };
    };

    // the slider keeps the pointer from the press on, so the moves and the release reach it even outside it
    const onPointerDown = (e: PointerEvent) => {
        if (isSecondaryPress(e)) return;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
        if (input.value) focusWithoutRing(input.value, { preventScroll: true });
        isDragging.value = true;
        onPointer(e, true);
    };

    // the preview belongs to the pointer; a keyboard use shows the value
    const clearPreview = () => {
        movingInfo.value = null;
    };

    const onFocus = (e: FocusEvent) => {
        if ((e.currentTarget as Element).matches(':focus-visible')) clearPreview();
    };

    const onInput = (e: Event) => emit('change', Number((e.target as HTMLInputElement).value));

    // the popup is anchored to the slider's center, so only a translate moves it to the pointer; the vertical offset
    // counts up from the bottom
    const tooltipProps = () => {
        if (!props.showTooltip) return {};
        const info = movingInfo.value;
        return {
            autoAdjustOverflow: true,
            position: props.vertical ? 'right' : 'top',
            style: { translate: info ? (props.vertical ? `0 ${-info.offset}px` : `${info.offset}px 0`) : undefined },
        };
    };
</script>

<template>
    <component :is="props.showTooltip ? Tooltip : SlotFragment" v-bind="tooltipProps()">
        <template #content>{{ formatTime(movingInfo ? movingInfo.progress * props.max : props.value) }}</template>
        <div
            :class="[
                `${prefix}-slider-wrapper`,
                {
                    [`${prefix}-slider-wrapper-vertical`]: props.vertical,
                    [`${prefix}-slider-wrapper-horizontal`]: !props.vertical,
                    [`${prefix}-slider-wrapper-dragging`]: isDragging,
                },
            ]"
            tabindex="-1"
            @lostpointercapture="isDragging = false"
            @mousedown.prevent
            @mouseenter="onPointer($event, false)"
            @pointerdown="onPointerDown"
            @pointermove="onPointer($event, true)"
        >
            <input
                ref="input"
                :aria-label="props.label"
                :aria-orientation="props.vertical ? 'vertical' : undefined"
                :aria-valuetext="props.getValueText(props.value)"
                :class="`${prefix}-slider-input`"
                :max="props.max"
                min="0"
                step="1"
                type="range"
                :value="props.value"
                @focus="onFocus"
                @input="onInput"
                @keydown="clearPreview"
            />
            <div
                ref="track"
                :class="[
                    `${prefix}-slider`,
                    `${prefix}-slider-${props.theme}`,
                    {
                        [`${prefix}-slider-vertical`]: props.vertical,
                        [`${prefix}-slider-horizontal`]: !props.vertical,
                    },
                ]"
                :style="props.vertical ? { height: toCssLength(props.height) } : undefined"
            >
                <div
                    :class="[
                        `${prefix}-slider-progress`,
                        {
                            [`${prefix}-slider-progress-vertical`]: props.vertical,
                            [`${prefix}-slider-progress-horizontal`]: !props.vertical,
                        },
                    ]"
                    :style="{
                        height: props.vertical ? `${percent}%` : '100%',
                        width: props.vertical ? '100%' : `${percent}%`,
                    }"
                />
                <div
                    :class="`${prefix}-slider-dot`"
                    :style="{
                        left: props.vertical ? '50%' : `calc(${percent}% - ${dotSize / 2}px)`,
                        bottom: props.vertical ? `calc(${percent}% - ${dotSize / 2}px)` : undefined,
                        top: props.vertical ? undefined : '50%',
                        transform: props.vertical ? 'translateX(-50%)' : 'translateY(-50%)',
                        pointerEvents: 'none',
                    }"
                />
            </div>
        </div>
    </component>
</template>
