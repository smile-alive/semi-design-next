<script setup lang="ts">
    import { computed, nextTick, normalizeStyle, useTemplateRef, type CSSProperties } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/tooltip/constants';
    import '@fibrae/semi-foundation/tooltip/tooltip.scss';
    import PopupLayerProvider from '../_base/popup-layer-provider.vue';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import { provideTooltipDescription } from './context';
    import type { TooltipEmits, TooltipHandle, TooltipProps, TooltipSlots } from './interface';
    import TooltipTrigger from './tooltip-trigger.vue';
    import TriangleArrow from './triangle-arrow.vue';
    import useTooltip from './use-tooltip';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TooltipProps>(), {
        motion: () => semiDefault('Tooltip', 'motion', true),
        autoAdjustOverflow: () => semiDefault('Tooltip', 'autoAdjustOverflow', true),
        arrowPointAtCenter: () => semiDefault('Tooltip', 'arrowPointAtCenter', true),
        trigger: () => semiDefault('Tooltip', 'trigger', 'hover'),
        position: () => semiDefault('Tooltip', 'position', 'top'),
        prefixCls: () => semiDefault('Tooltip', 'prefixCls', cssClasses.PREFIX),
        role: () => semiDefault('Tooltip', 'role', 'tooltip'),
        mouseEnterDelay: () => semiDefault('Tooltip', 'mouseEnterDelay', numbers.MOUSE_ENTER_DELAY),
        mouseLeaveDelay: () => semiDefault('Tooltip', 'mouseLeaveDelay', numbers.MOUSE_LEAVE_DELAY),
        spacing: () => semiDefault('Tooltip', 'spacing', numbers.SPACING),
        showArrow: () => semiDefault('Tooltip', 'showArrow', true),
        wrapWhenSpecial: () => semiDefault('Tooltip', 'wrapWhenSpecial', true),
        closeOnEsc: () => semiDefault('Tooltip', 'closeOnEsc', true),
        guardFocus: () => semiDefault('Tooltip', 'guardFocus', false),
        returnFocusOnClose: () => semiDefault('Tooltip', 'returnFocusOnClose', false),
        disableFocusListener: () => semiDefault('Tooltip', 'disableFocusListener', false),
        disableArrowKeyDown: () => semiDefault('Tooltip', 'disableArrowKeyDown', false),
        keepDOM: () => semiDefault('Tooltip', 'keepDOM', false),
        condition: () => semiDefault('Tooltip', 'condition', true),
        visible: semiGlobalDefault('Tooltip', 'visible'),
        clickToHide: semiGlobalDefault('Tooltip', 'clickToHide'),
        clickTriggerToHide: semiGlobalDefault('Tooltip', 'clickTriggerToHide'),
        stopPropagation: semiGlobalDefault('Tooltip', 'stopPropagation'),
        preventScroll: semiGlobalDefault('Tooltip', 'preventScroll'),
        wrapperId: undefined,
        wrapperClassName: semiGlobalDefault('Tooltip', 'wrapperClassName'),
        ariaLabel: semiGlobalDefault('Tooltip', 'ariaLabel'),
        ariaLabelledby: semiGlobalDefault('Tooltip', 'ariaLabelledby'),
        ariaDescribedby: semiGlobalDefault('Tooltip', 'ariaDescribedby'),
    });

    const emit = defineEmits<TooltipEmits>();
    defineSlots<TooltipSlots>();

    const container = useTemplateRef('container');

    const { foundation, state, context, popupId, contentShown, active, contentSlotProps, setTriggerElement, handle } = useTooltip(props, emit, container);

    const vertical = computed(() => props.position.startsWith('left') || props.position.startsWith('right'));

    // The content is teleported but injects through this component, under an outer trigger whose id must not reach it.
    provideTooltipDescription(computed(() => undefined));

    const arrowStyle = (style: unknown): CSSProperties => {
        const normalized = normalizeStyle([style]) as CSSProperties & { 'background-color'?: string };
        return { color: normalized.backgroundColor ?? normalized['background-color'], fill: 'currentColor' };
    };

    const beforeToggle = async (event: Event) => {
        if ((event as ToggleEvent).newState !== 'open') return;
        contentShown.value = true;
        // showPopover() ran its autofocus step before the content mounted, so the step is applied once it renders.
        await nextTick();
        // handleShown measured the popup without its content: a top popup placed by a zero height would hang over the
        // trigger and take the next click until the resize observer runs
        foundation.calcPosition();
        container.value?.querySelector<HTMLElement>('[autofocus]')?.focus({ preventScroll: props.preventScroll });
    };

    const stop = (event: Event) => {
        if (props.stopPropagation) event.stopPropagation();
    };

    const click = (event: MouseEvent) => {
        if (props.clickToHide && !state.value.portalEventSet.click) foundation.hide();
        stop(event);
    };

    defineExpose<TooltipHandle>(handle);
</script>

<template>
    <TooltipTrigger :inserted="state.isInsert" :keydown="state.triggerEventSet.keydown" :nodes="slotNodes($slots.default?.() ?? [])" :options="props" :popupId="popupId" :visible="state.visible" @element="setTriggerElement" />
    <Teleport v-if="state.isInsert && state.portalTarget" :disabled="!active && state.visible" :to="state.portalTarget as HTMLElement">
        <div
            :id="popupId"
            ref="container"
            :aria-describedby="props.role === 'dialog' ? props.ariaDescribedby : undefined"
            :aria-label="props.role === 'dialog' ? props.ariaLabel : undefined"
            :aria-labelledby="props.role === 'dialog' ? props.ariaLabelledby : undefined"
            :class="[
                $attrs.class,
                state.colorScheme,
                `${props.prefixCls}-wrapper`,
                {
                    [`${props.prefixCls}-wrapper-show`]: state.visible,
                    [`${props.prefixCls}-with-arrow`]: props.showArrow,
                    [`${props.prefixCls}-point-at-center`]: props.showArrow && props.arrowPointAtCenter,
                    [`${props.prefixCls}-no-motion`]: !props.motion,
                },
            ]"
            :dir="context.direction"
            popover="manual"
            :role="props.role"
            :style="$attrs.style as CSSProperties"
            :tabindex="-1"
            @beforetoggle="beforeToggle"
            @click="click"
            @focusin="stop"
            @focusout="stop"
            @keydown="foundation.handleContainerKeydown($event)"
            @mousedown="stop"
        >
            <div v-if="contentShown" :class="`${cssClasses.PREFIX}-content`">
                <PopupLayerProvider>
                    <slot name="content" v-bind="contentSlotProps" />
                </PopupLayerProvider>
            </div>
            <slot v-if="props.showArrow" name="arrow">
                <TriangleArrow :class="`${props.prefixCls}-icon-arrow`" :style="arrowStyle($attrs.style)" :vertical="vertical" />
            </slot>
        </div>
    </Teleport>
</template>
