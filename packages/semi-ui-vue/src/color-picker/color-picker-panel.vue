<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/color-picker/constants';
    import { groupRole } from '../_base/group-role';
    import AlphaSlider from './alpha-slider.vue';
    import ColorChooseArea from './color-choose-area.vue';
    import ColorSlider from './color-slider.vue';
    import { useColorPickerContext } from './context';
    import DataPart from './data-part.vue';
    import type { ColorPickerPanelSlots } from './interface';

    // Not exposed on its own: ColorPicker renders it inline or inside the popover, so the structure is written once.
    defineSlots<ColorPickerPanelSlots>();

    const { view, foundation } = useColorPickerContext('ColorPicker panel');

    // The latest color, not the one of the render that bound the listener
    const onAreaChange = ({ s, v }: { s: number; v: number }) => {
        const { h, a } = view.value.currentColor.hsva;
        foundation.handleChange({ s, v, a, h }, 'hsva');
    };
</script>

<template>
    <div :class="cssClasses.PREFIX" :role="groupRole($attrs)">
        <slot name="topSlot" />
        <ColorChooseArea :handleSize="20" :height="view.height" :hsva="view.currentColor.hsva" :width="view.width" @change="onAreaChange" />
        <ColorSlider class="colorSliderWrapper" :foundation="foundation" :handleSize="18" :height="10" :hue="view.currentColor.hsva.h" :width="view.width" />
        <AlphaSlider v-if="view.alpha" :foundation="foundation" :handleSize="18" :height="10" :hsva="view.currentColor.hsva" :width="view.width" />
        <DataPart :alpha="view.alpha" :currentColor="view.currentColor" :defaultFormat="view.defaultFormat" :eyeDropper="view.eyeDropper" :foundation="foundation" :width="view.width" />
        <slot name="bottomSlot" />
    </div>
</template>
