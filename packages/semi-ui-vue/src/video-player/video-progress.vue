<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
    import VideoProgressFoundation, { type VideoProgressAdapter } from '@fibrae/semi-foundation/video-player/progress-foundation';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/video-player/video-player.scss';
    import SlotFragment from '../_base/slot-fragment';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { VideoProgressEmits, VideoProgressProps, VideoProgressState } from './interface';

    type Foundation = VideoProgressFoundation<VideoProgressProps, VideoProgressState>;
    type Adapter = VideoProgressAdapter<VideoProgressProps, VideoProgressState>;

    const props = withDefaults(defineProps<VideoProgressProps>(), { markers: undefined, showTooltip: true });
    const emit = defineEmits<VideoProgressEmits>();

    const localeResult = useLocale('VideoPlayer');

    // Annotated: the adapter's getSliderRef reads this ref, so inference is circular (TS7022)
    const slider = useTemplateRef<HTMLDivElement>('slider');

    const prefix = cssClasses.PREFIX_PROGRESS;
    const locale = computed(() => localeResult.value.locale);
    const markersList = computed(() => VideoProgressFoundation.getMarkersList(props.markers, props.max));

    const { foundation, state } = useFoundation<Foundation, Adapter, VideoProgressProps, VideoProgressState>(
        VideoProgressFoundation,
        props,
        () => ({
            isDragging: false,
            movingInfo: null,
            activeIndex: -1,
        }),
        (base) => ({
            getSliderRef: () => slider.value,
            getMarkersList: () => markersList.value,
            setIsDragging: (isDragging) => base.setState({ isDragging }),
            setActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setMovingInfo: (movingInfo) => base.setState({ movingInfo }),
            notifyChange: (value) => emit('change', value),
        })
    );

    const onFocus = (e: FocusEvent) => foundation.handleFocus(e as FocusEvent & { currentTarget: Element });

    const onPointerDown = (e: PointerEvent) => foundation.handlePointerDown(e as PointerEvent & { currentTarget: Element });

    // the pointer's position, or the playhead when the bar is used by keyboard
    const previewValue = () => state.value.movingInfo?.value ?? props.value;

    const hoverTitle = () => {
        const value = previewValue();
        return VideoProgressFoundation.getMarkerTitle(markersList.value, value);
    };

    // The popup is anchored to the bar's center, so only a translate moves it to the pointer
    const tooltipProps = () => {
        if (!props.showTooltip) return {};
        const info = state.value.movingInfo;
        return {
            class: `${prefix}-tooltip`,
            position: 'top',
            spacing: 2,
            style: { translate: info ? `${info.offset}px 0` : undefined },
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
            @mouseenter="foundation.handlePointerPosition($event, { seek: false })"
            @pointerdown="onPointerDown"
            @pointermove="foundation.handlePointerPosition($event, { seek: true })"
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
