<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/components/color-picker/color-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import { hsvaToHslString } from '@fibrae/semi-foundation/components/color-picker/utils/convert';
    import useFoundation from '../../base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { toDragEvent } from './drag-event';
    import type { ColorSliderProps } from './interface';

    type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
    type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

    const props = defineProps<ColorSliderProps>();
    const emit = defineEmits<{ change: [hue: number] }>();

    const i18n = useLocale('ColorPicker');

    const dom = useTemplateRef('dom');

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        props,
        () => ColorSliderFoundation.getInitialState(),
        () => ({
            getDOM: () => dom.value as HTMLDivElement,
            notifyChange: (value) => emit('change', value),
        }),
        { props: { value: () => props.hue, max: () => 360 } }
    );

    const onInput = (event: Event) => {
        const input = event.target as HTMLInputElement;
        foundation.setValue(Number(input.value));
        // A change the owner does not accept leaves the slider unrendered, and Vue would not move the DOM value back.
        input.value = String(Math.round(props.hue));
    };
</script>

<template>
    <div ref="dom" :class="`${cssClasses.PREFIX}-colorSlider`" :style="{ width: `${props.width}px`, height: `${props.height}px` }" @lostpointercapture="foundation.handleLostPointerCapture" @pointerdown="foundation.handlePointerDown(toDragEvent($event))" @pointermove="foundation.handlePointerMove(toDragEvent($event))">
        <div
            :class="`${cssClasses.PREFIX}-handle`"
            :style="{
                width: `${props.handleSize}px`,
                height: `${props.handleSize}px`,
                left: `${ColorSliderFoundation.getHandlePosition({ value: props.hue, max: 360, width: props.width }, props.handleSize)}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 }),
            }"
        >
            <input :aria-label="i18n.locale.hue" :class="`${cssClasses.PREFIX}-handleSlider`" :max="360" :min="0" type="range" :value="Math.round(props.hue)" @input="onInput" @keydown="foundation.handleKeyDown" />
        </div>
    </div>
</template>
