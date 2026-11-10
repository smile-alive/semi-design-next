<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/video-player/constants';
    import VideoProgressFoundation, { type VideoProgressAdapter, type VideoProgressBaseState } from '@fibrae/semi-foundation/components/video-player/progress-foundation';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/components/video-player/utils';
    import '@fibrae/semi-foundation/components/video-player/video-player.scss';
    import { SlotFragment, useFoundation } from '../../base/index';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { VideoProgressEmits, VideoProgressProps } from './interface';

    type Foundation = VideoProgressFoundation<VideoProgressProps>;
    type Adapter = VideoProgressAdapter<VideoProgressProps>;

    const props = withDefaults(defineProps<VideoProgressProps>(), { markers: undefined, showTooltip: true });
    const emit = defineEmits<VideoProgressEmits>();

    const localeResult = useLocale('VideoPlayer');

    // Annotated: the adapter's getSliderRef reads this ref, so inference is circular (TS7022)
    const slider = useTemplateRef<HTMLDivElement>('slider');

    const { foundation, state } = useFoundation<Foundation, Adapter, VideoProgressProps, VideoProgressBaseState>(
        VideoProgressFoundation,
        props,
        () => VideoProgressFoundation.getInitialState(),
        () => ({
            getSliderRef: () => slider.value,
            notifyChange: (value) => emit('change', value),
        })
    );

    const prefix = cssClasses.PREFIX_PROGRESS;
    const locale = computed(() => localeResult.value.locale);
    const markersList = computed(() => VideoProgressFoundation.getMarkersList(props.markers, props.max));

    const onFocus = (e: FocusEvent) => foundation.handleFocus(e as FocusEvent & { currentTarget: Element });

    const onPointerDown = (e: PointerEvent) => foundation.handlePointerDown(e as PointerEvent & { currentTarget: Element });

    // the pointer's position, or the playhead when the bar is used by keyboard
    const previewValue = () => state.value.movingInfo?.value ?? props.value;

    const hoverTitle = () => {
        const value = previewValue();
        return VideoProgressFoundation.getMarkerTitle(markersList.value, value);
    };

    const tooltipProps = () => {
        if (!props.showTooltip) return {};
        const info = state.value.movingInfo;
        return {
            class: `${prefix}-tooltip`,
            position: 'top',
            spacing: 2,
            style: { translate: info ? VideoProgressFoundation.getPreviewTranslate(info.offset) : undefined },
        };
    };
</script>

<template>
    <component :is="props.showTooltip ? Tooltip : SlotFragment" v-bind="tooltipProps()">
        <template #content>
            <template v-if="markersList.length > 0">
                <div :class="`${prefix}-tooltip-content`">{{ hoverTitle() }}</div>
                <div :class="`${prefix}-tooltip-content`">{{ formatTime(previewValue()) }}</div>
            </template>
            <template v-else>{{ formatTime(previewValue()) }}</template>
        </template>
        <div
            ref="slider"
            :aria-label="locale.progress"
            :aria-valuemax="props.max"
            aria-valuemin="0"
            :aria-valuenow="props.value"
            :aria-valuetext="`${formatTimeText(props.value, locale)} / ${formatTimeText(props.max, locale)}`"
            :class="[prefix, { [`${prefix}-dragging`]: state.isDragging }]"
            role="slider"
            tabindex="0"
            @focus="onFocus"
            @keydown="foundation.handleKeyDown"
            @lostpointercapture="foundation.handleLostPointerCapture"
            @mouseenter="foundation.handlePointerEnter"
            @pointerdown="onPointerDown"
            @pointermove="foundation.handlePointerMove"
        >
            <div :class="`${prefix}-markers`">
                <div v-for="(marker, index) in markersList" :key="`${marker.start}-${index}`" :class="[`${prefix}-slider`, { [`${prefix}-slider-active`]: index === state.activeIndex && state.isDragging }]" :style="{ left: marker.left, width: marker.width }">
                    <div :class="`${prefix}-slider-list`" />
                    <div :class="`${prefix}-slider-buffered`" :style="{ width: VideoProgressFoundation.getValueWidth(marker, props.bufferedValue) }" />
                    <div :class="`${prefix}-slider-played`" :style="{ width: VideoProgressFoundation.getValueWidth(marker, props.value) }" />
                </div>
            </div>
            <div :class="`${prefix}-handle`" :style="{ left: VideoProgressFoundation.getHandleLeft(props.value, props.max) }" />
        </div>
    </component>
</template>
