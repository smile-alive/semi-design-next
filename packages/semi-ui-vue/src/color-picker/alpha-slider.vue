<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import ColorSliderFoundation, { type ColorSliderAdapter, type ColorSliderBaseProps, type ColorSliderBaseState } from '@fibrae/semi-foundation/color-picker/color-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { toDragEvent } from './drag-event';
    import type { AlphaSliderProps } from './interface';

    type Foundation = ColorSliderFoundation<ColorSliderBaseProps>;
    type Adapter = ColorSliderAdapter<ColorSliderBaseProps>;

    const props = defineProps<AlphaSliderProps>();
    const emit = defineEmits<{ change: [alpha: number] }>();

    const i18n = useLocale('ColorPicker');

    const dom = useTemplateRef('dom');

    const { foundation } = useFoundation<Foundation, Adapter, ColorSliderBaseProps, ColorSliderBaseState>(
        ColorSliderFoundation,
        props,
        () => ColorSliderFoundation.getInitialState(),
        () => ({
            getDOM: () => dom.value as HTMLDivElement,
            notifyChange: (percent) => emit('change', percent / 100),
        }),
        { props: { value: () => props.hsva.a * 100, max: () => 100 } }
    );

    const onInput = (event: Event) => {
        const input = event.target as HTMLInputElement;
        foundation.setValue(Number(input.value));
        // A change the owner does not accept leaves the slider unrendered, and Vue would not move the DOM value back.
        input.value = String(round(props.hsva.a * 100));
    };
</script>

<template>
    <div ref="dom" :class="`${cssClasses.PREFIX}-alphaSlider`" :style="{ width: `${props.width}px`, height: `${props.height}px` }" @lostpointercapture="foundation.handleLostPointerCapture" @pointerdown="foundation.handlePointerDown(toDragEvent($event))" @pointermove="foundation.handlePointerMove(toDragEvent($event))">
        <div
            :class="`${cssClasses.PREFIX}-alphaSliderInner`"
            :style="{
                background: `linear-gradient(90deg, ${hsvaToHslaString({ ...props.hsva, a: 0 })}, ${hsvaToHslaString({ ...props.hsva, a: 1 })})`,
            }"
        >
            <div
                :class="`${cssClasses.PREFIX}-alphaHandle`"
                :style="{
                    width: `${props.handleSize}px`,
                    height: `${props.handleSize}px`,
                    left: `${ColorSliderFoundation.getHandlePosition({ value: props.hsva.a * 100, max: 100, width: props.width }, props.handleSize)}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: hsvaToRgbaString(props.hsva),
                }"
            >
                <input :aria-label="i18n.locale.alpha" :aria-valuetext="`${round(props.hsva.a * 100)}%`" :class="`${cssClasses.PREFIX}-handleSlider`" :max="100" :min="0" type="range" :value="round(props.hsva.a * 100)" @input="onInput" @keydown="foundation.handleKeyDown" />
            </div>
        </div>
    </div>
</template>
