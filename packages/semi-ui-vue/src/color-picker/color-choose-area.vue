<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import ColorChooseAreaFoundation, { type ColorChooseAreaAdapter, type ColorChooseAreaBaseProps, type ColorChooseAreaBaseState } from '@fibrae/semi-foundation/color-picker/color-choose-area-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import ColorPickerFoundation from '@fibrae/semi-foundation/color-picker/foundation';
    import { hsvaToHslString, hsvaToRgba } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { toDragEvent } from './drag-event';
    import type { ColorChooseAreaProps } from './interface';

    type Foundation = ColorChooseAreaFoundation<ColorChooseAreaBaseProps>;
    type Adapter = ColorChooseAreaAdapter<ColorChooseAreaBaseProps>;

    const props = defineProps<ColorChooseAreaProps>();
    const emit = defineEmits<{ change: [color: { s: number; v: number }] }>();

    const i18n = useLocale('ColorPicker');

    const dom = useTemplateRef('dom');

    const { foundation, state } = useFoundation<Foundation, Adapter, ColorChooseAreaBaseProps, ColorChooseAreaBaseState>(
        ColorChooseAreaFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        () => ({
            // the foundation guards a missing element itself
            getDOM: () => dom.value as HTMLDivElement,
            notifyChange: (color) => emit('change', color),
        })
    );

    const handlePosition = computed(() => ColorPickerFoundation.getHandlePositionByHSVA(props.hsva, { width: props.width, height: props.height }, props.handleSize));

    const handleColor = computed(() => {
        const { r, g, b, a } = hsvaToRgba(props.hsva);
        return `rgba(${r},${g},${b},${a})`;
    });

    // both ranges report the same two-dimensional position, as React Aria's ColorArea does
    const valueText = computed(() => i18n.value.locale.saturationBrightness.replace('${saturation}', String(round(props.hsva.s))).replace('${brightness}', String(round(props.hsva.v))));

    const sliders = computed(
        () =>
            [
                { axis: 's', name: i18n.value.locale.saturation },
                { axis: 'v', name: i18n.value.locale.brightness },
            ] as const
    );

    const onInput = (event: Event, axis: 's' | 'v') => {
        const input = event.target as HTMLInputElement;
        foundation.setValue(axis, Number(input.value));
        // A change the owner does not accept leaves the area unrendered, and Vue would not move the DOM value back.
        input.value = String(round(props.hsva[axis]));
    };
</script>

<template>
    <div
        ref="dom"
        :class="`${cssClasses.PREFIX}-colorChooseArea`"
        :style="{ backgroundColor: hsvaToHslString({ h: props.hsva.h, s: 100, v: 100, a: 1 }), width: `${props.width}px`, height: `${props.height}px`, cursor: state.isHandleGrabbing ? 'grabbing' : 'pointer' }"
        @lostpointercapture="foundation.handleLostPointerCapture"
        @pointerdown="foundation.handlePointerDown(toDragEvent($event))"
        @pointermove="foundation.handlePointerMove(toDragEvent($event))"
    >
        <div
            :class="`${cssClasses.PREFIX}-handle`"
            :style="{
                width: `${props.handleSize}px`,
                height: `${props.handleSize}px`,
                left: `${handlePosition.x}px`,
                top: `${handlePosition.y}px`,
                backgroundColor: handleColor,
            }"
        >
            <input
                v-for="slider in sliders"
                :key="slider.axis"
                :aria-label="slider.name"
                :aria-valuetext="valueText"
                :class="`${cssClasses.PREFIX}-handleSlider`"
                :max="100"
                :min="0"
                type="range"
                :value="round(props.hsva[slider.axis])"
                @input="onInput($event, slider.axis)"
                @keydown="foundation.handleKeyDown(slider.axis, $event)"
            />
        </div>
    </div>
</template>
