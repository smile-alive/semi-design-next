<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import AlphaSliderFoundation, { type AlphaSliderAdapter, type AlphaSliderBaseProps, type AlphaSliderBaseState } from '@fibrae/semi-foundation/color-picker/alpha-slider-foundation';
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import { hsvaToHslaString, hsvaToRgbaString } from '@fibrae/semi-foundation/color-picker/utils/convert';
    import { round } from '@fibrae/semi-foundation/color-picker/utils/round';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { toDragEvent } from './drag-event';
    import type { AlphaSliderProps } from './interface';

    type Foundation = AlphaSliderFoundation<AlphaSliderBaseProps>;
    type Adapter = AlphaSliderAdapter<AlphaSliderBaseProps>;

    const props = defineProps<AlphaSliderProps>();

    const i18n = useLocale('ColorPicker');

    const dom = useTemplateRef('dom');

    const { foundation } = useFoundation<Foundation, Adapter, AlphaSliderBaseProps, AlphaSliderBaseState>(
        AlphaSliderFoundation,
        props,
        () => ({ isHandleGrabbing: false }),
        // the foundation guards a missing element itself
        () => ({ getDOM: () => dom.value as HTMLDivElement })
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
                    left: `${props.hsva.a * props.width - props.handleSize / 2}px`,
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
