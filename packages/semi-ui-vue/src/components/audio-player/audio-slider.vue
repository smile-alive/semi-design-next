<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/audio-player/constants';
    import SeekFoundation, { type SeekAdapter, type SeekBaseProps, type SeekBaseState } from '@fibrae/semi-foundation/components/video-player/seek-foundation';
    import { formatTime } from '@fibrae/semi-foundation/components/video-player/utils';
    import { toCssLength, focusWithoutRing } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/audio-player/audio-player.scss';
    import { SlotFragment, useFoundation } from '../../base/index';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { AudioSliderEmits, AudioSliderProps } from './interface';

    type Foundation = SeekFoundation<SeekBaseProps>;
    type Adapter = SeekAdapter<SeekBaseProps>;

    const props = withDefaults(defineProps<AudioSliderProps>(), {
        value: 0,
        max: 100,
        vertical: false,
        height: 4,
        showTooltip: true,
        theme: 'dark',
    });

    const emit = defineEmits<AudioSliderEmits>();

    // Annotated: the adapter reads these refs, so inference is circular (TS7022)
    const track = useTemplateRef<HTMLDivElement>('track');
    const input = useTemplateRef<HTMLInputElement>('input');

    const { foundation, state } = useFoundation<Foundation, Adapter, SeekBaseProps, SeekBaseState>(
        SeekFoundation,
        props,
        () => SeekFoundation.getInitialState(),
        () => ({
            getSliderRef: () => track.value,
            notifyChange: (value) => emit('change', value),
            // Chrome treats a scripted focus on a range input as keyboard focus; the ring is for the keyboard only
            focusOnPress: () => {
                if (input.value) focusWithoutRing(input.value, { preventScroll: true });
            },
        })
    );

    const prefix = cssClasses.PREFIX;

    // $size-audio-player-slider-dot
    const dotSize = 16;
    const percent = computed(() => (props.max ? (props.value / props.max) * 100 : 0));

    // Template notes, kept here because a template comment would become an extra node in the Tooltip's trigger slot:
    // - tabindex="-1" on the wrapper stops the Tooltip adding a Tab stop; the hidden native range input is the control;
    // - mousedown.prevent keeps the mouse from moving focus from the input to the wrapper;
    // - the input binds max before value, so a range that grows and moves in one update keeps the new value;
    // - the dot stays inside the track like a native range thumb.

    const onPointerDown = (e: PointerEvent) => foundation.handlePointerDown(e as PointerEvent & { currentTarget: Element });

    const onFocus = (e: FocusEvent) => foundation.handleFocus(e as FocusEvent & { currentTarget: Element });

    const onInput = (e: Event) => emit('change', Number((e.target as HTMLInputElement).value));

    const tooltipProps = () => {
        if (!props.showTooltip) return {};
        const info = state.value.movingInfo;
        return {
            autoAdjustOverflow: true,
            position: props.vertical ? 'right' : 'top',
            style: { translate: info ? SeekFoundation.getPreviewTranslate(info.offset, props.vertical) : undefined },
        };
    };
</script>

<template>
    <component :is="props.showTooltip ? Tooltip : SlotFragment" v-bind="tooltipProps()">
        <template #content>{{ formatTime(state.movingInfo ? state.movingInfo.value : props.value) }}</template>
        <div
            :class="[
                `${prefix}-slider-wrapper`,
                {
                    [`${prefix}-slider-wrapper-vertical`]: props.vertical,
                    [`${prefix}-slider-wrapper-horizontal`]: !props.vertical,
                    [`${prefix}-slider-wrapper-dragging`]: state.isDragging,
                },
            ]"
            tabindex="-1"
            @lostpointercapture="foundation.handleLostPointerCapture"
            @mousedown.prevent
            @mouseenter="foundation.handlePointerEnter"
            @pointerdown="onPointerDown"
            @pointermove="foundation.handlePointerMove"
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
                @keydown="foundation.clearPreview"
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
