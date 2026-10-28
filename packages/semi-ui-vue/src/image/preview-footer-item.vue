<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-vue';
    import SlotFragment from '../_base/slot-fragment';
    import Slider from '../slider';
    import Tooltip from '../tooltip';
    import type { FooterButtonName, FooterItemName, FooterView } from './footer';

    const props = defineProps<{ item: FooterItemName; view: FooterView }>();

    const prefixCls = cssClasses.PREFIX;
    const footerCls = `${prefixCls}-preview-footer`;

    const icons = {
        prev: IconChevronLeft,
        next: IconChevronRight,
        zoomOut: IconMinus,
        zoomIn: IconPlus,
        rotate: IconRotate,
        download: IconDownload,
    };

    const iconOf = (item: FooterButtonName) => {
        if (item === 'ratio') {
            return props.view.ratio === 'adaptation' ? IconRealSizeStroked : IconWindowAdaptionStroked;
        }
        return icons[item];
    };

    const toPercentText = (value: number) => `${value}%`;
</script>

<template>
    <div v-if="props.item === 'page'" aria-atomic="true" aria-live="polite" :class="`${footerCls}-page`">{{ props.view.curPage }}/{{ props.view.totalNum }}</div>
    <Slider
        v-else-if="props.item === 'slider'"
        :ariaLabel="props.view.zoomLabel"
        :getAriaValueText="toPercentText"
        :max="props.view.max"
        :min="props.view.min"
        :modelValue="props.view.zoom"
        :step="props.view.step"
        :tipFormatter="toPercentText"
        :tooltipVisible="props.view.showTooltip ? undefined : false"
        @change="props.view.onSlide"
    />
    <!-- disabled stays focusable (aria-disabled) so focus is not lost at the last image or zoom limit -->
    <component :is="props.view.showTooltip ? Tooltip : SlotFragment" v-else>
        <template #content>{{ props.view.buttons[props.item].label }}</template>
        <button
            :aria-disabled="props.view.buttons[props.item].disabled || undefined"
            :aria-label="props.view.buttons[props.item].label"
            :class="[
                `${footerCls}-button`,
                {
                    [`${prefixCls}-tooltip-children-wrapper`]: props.view.showTooltip,
                    [`${footerCls}-gap`]: props.item === 'ratio' || props.item === 'download',
                },
            ]"
            type="button"
            @click="props.view.buttons[props.item].disabled || props.view.buttons[props.item].onClick()"
        >
            <component :is="iconOf(props.item)" :class="{ [`${footerCls}-disabled`]: props.view.buttons[props.item].disabled }" size="large" />
        </button>
    </component>
</template>
