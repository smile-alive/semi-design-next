<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/color-picker/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import AlphaSlider from './alpha-slider.vue';
    import ColorChooseArea from './color-choose-area.vue';
    import ColorSlider from './color-slider.vue';
    import { useColorPickerContext } from './context';
    import DataPart from './data-part.vue';
    import type { ColorPickerPanelSlots } from './interface';

    defineSlots<ColorPickerPanelSlots>();

    const { view, foundation } = useColorPickerContext('ColorPicker panel');
</script>

<template>
    <div :class="cssClasses.PREFIX" :role="namedRole($attrs)">
        <slot name="topSlot" />
        <ColorChooseArea :handleSize="20" :height="view.height" :hsva="view.currentColor.hsva" :width="view.width" @change="foundation.handleAreaChange" />
        <ColorSlider class="colorSliderWrapper" :handleSize="18" :height="10" :hue="view.currentColor.hsva.h" :width="view.width" @change="foundation.handleHueChange" />
        <AlphaSlider v-if="view.alpha" :handleSize="18" :height="10" :hsva="view.currentColor.hsva" :width="view.width" @change="foundation.handleAlphaChange" />
        <DataPart :alpha="view.alpha" :currentColor="view.currentColor" :defaultFormat="view.defaultFormat" :eyeDropper="view.eyeDropper" :width="view.width" @alphaChange="foundation.handleAlphaChange" @change="foundation.handleChange" />
        <slot name="bottomSlot" />
    </div>
</template>
