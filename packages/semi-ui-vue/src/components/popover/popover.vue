<script setup lang="ts">
    import { computed, normalizeStyle, useTemplateRef, type CSSProperties } from 'vue';
    import { cssClasses, getPopoverRole, getPopoverSpacing } from '@fibrae/semi-foundation/components/popover/constants';
    import '@fibrae/semi-foundation/components/popover/popover.scss';
    import { semiDefault, semiGlobalDefault } from '../../base/index';
    import { provideTooltipPrefixContext } from '../tooltip/context';
    import type { TooltipProps } from '../tooltip/interface';
    import Tooltip from '../tooltip/tooltip.vue';
    import Arrow from './arrow.vue';
    import type { PopoverEmits, PopoverHandle, PopoverProps, PopoverSlots } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<PopoverProps>(), {
        showArrow: () => semiDefault('Popover', 'showArrow', false),
        autoAdjustOverflow: () => semiDefault('Popover', 'autoAdjustOverflow', true),
        motion: () => semiDefault('Popover', 'motion', true),
        trigger: () => semiDefault('Popover', 'trigger', 'hover'),
        position: () => semiDefault('Popover', 'position', 'bottom'),
        closeOnEsc: () => semiDefault('Popover', 'closeOnEsc', true),
        returnFocusOnClose: () => semiDefault('Popover', 'returnFocusOnClose', true),
        guardFocus: () => semiDefault('Popover', 'guardFocus', true),
        visible: semiGlobalDefault('Popover', 'visible'),
        role: semiGlobalDefault('Popover', 'role'),
        mouseEnterDelay: semiGlobalDefault('Popover', 'mouseEnterDelay'),
        mouseLeaveDelay: semiGlobalDefault('Popover', 'mouseLeaveDelay'),
        contentClassName: semiGlobalDefault('Popover', 'contentClassName'),
        spacing: semiGlobalDefault('Popover', 'spacing'),
        stopPropagation: semiGlobalDefault('Popover', 'stopPropagation'),
        arrowStyle: semiGlobalDefault('Popover', 'arrowStyle'),
        arrowPointAtCenter: semiGlobalDefault('Popover', 'arrowPointAtCenter'),
        clickToHide: semiGlobalDefault('Popover', 'clickToHide'),
        disableArrowKeyDown: semiGlobalDefault('Popover', 'disableArrowKeyDown'),
        disableFocusListener: semiGlobalDefault('Popover', 'disableFocusListener'),
        keepDOM: semiGlobalDefault('Popover', 'keepDOM'),
        condition: semiGlobalDefault('Popover', 'condition'),
        ariaLabel: semiGlobalDefault('Popover', 'ariaLabel'),
        ariaLabelledby: semiGlobalDefault('Popover', 'ariaLabelledby'),
        ariaDescribedby: semiGlobalDefault('Popover', 'ariaDescribedby'),
    });

    const emit = defineEmits<PopoverEmits>();
    defineSlots<PopoverSlots>();

    const tooltip = useTemplateRef('tooltip');

    const tooltipProps = computed<TooltipProps>(() => {
        const { contentClassName: _class, arrowStyle: _arrow, role, spacing, stopPropagation, ...shared } = props;
        return {
            ...shared,
            role: getPopoverRole(role, props.trigger),
            spacing: getPopoverSpacing(spacing, props.showArrow),
            stopPropagation: stopPropagation === undefined ? undefined : Boolean(stopPropagation),
        };
    });

    provideTooltipPrefixContext(cssClasses.PREFIX);

    const popupStyle = (style: unknown): CSSProperties => {
        const normalized = normalizeStyle([style]) as CSSProperties;
        return {
            backgroundColor: normalized.backgroundColor ?? normalized['background-color'],
            borderColor: normalized.borderColor ?? normalized['border-color'],
        };
    };

    defineExpose<PopoverHandle>({ focusTrigger: () => tooltip.value?.focusTrigger(), getPopup: () => tooltip.value?.getPopup() ?? null, rePosition: () => tooltip.value?.rePosition() });
</script>

<template>
    <Tooltip
        ref="tooltip"
        v-bind="tooltipProps"
        :class="$attrs.class"
        :style="$attrs.style"
        @afterClose="(...args) => emit('afterClose', ...args)"
        @afterOpen="emit('afterOpen')"
        @clickOutSide="(...args) => emit('clickOutSide', ...args)"
        @escKeyDown="(...args) => emit('escKeyDown', ...args)"
        @open="emit('open')"
        @update:visible="(...args) => emit('update:visible', ...args)"
        @visibleChange="(...args) => emit('visibleChange', ...args)"
    >
        <slot />
        <template #content="slotProps">
            <div :class="[cssClasses.PREFIX, props.contentClassName]">
                <div :class="`${cssClasses.PREFIX}-content`">
                    <slot name="content" v-bind="slotProps" />
                </div>
            </div>
        </template>
        <template #arrow>
            <Arrow :arrowStyle="props.arrowStyle" :popStyle="popupStyle($attrs.style)" :position="props.position" />
        </template>
    </Tooltip>
</template>
