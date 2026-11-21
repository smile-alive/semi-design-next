<script setup lang="ts">
    import { computed } from 'vue';
    import { focusableSelector, stepsClasses } from '@fibrae/semi-foundation/components/steps/constants';
    import { getStepState } from '@fibrae/semi-foundation/components/steps/utils';
    import '@fibrae/semi-foundation/components/steps/steps.scss';
    import { IconAlertCircle, IconAlertTriangle, IconChevronRight, IconTickCircle } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../../base/index';
    import { hasSlotContent } from '../../utils/index';
    import { useStepItemContext, useStepsContext } from './context';
    import type { StepProps, StepSlots } from './interface';
    import { useStepItem } from './use-step-item';

    const props = defineProps<StepProps & /* @vue-ignore */ ElementProps<'div', keyof StepProps>>();
    const slots = defineSlots<StepSlots>();

    const steps = useStepsContext();
    const position = useStepItemContext();

    const item = useStepItem(() => Boolean(steps?.view.value.clickable));

    const prefixCls = stepsClasses.ITEM;
    const statusIcons = { error: IconAlertCircle, finish: IconTickCircle, warning: IconAlertTriangle };
    const basicIconSize = { small: 'large', default: 'extra-large' } as const;

    const view = computed(() => {
        if (!steps || !position) return undefined;
        const { current, initial, status } = steps.view.value;
        const { index, total } = position.value;
        const stepNumber = initial + index;
        const state = getStepState(stepNumber, current, status, Boolean(props.status));
        const ownStatus = state.status ?? props.status ?? 'wait';
        return {
            ...steps.view.value,
            index,
            total,
            stepNumber,
            label: `${stepNumber + 1}`,
            status: ownStatus,
            statusIcon: ownStatus in statusIcons ? statusIcons[ownStatus as keyof typeof statusIcons] : undefined,
            active: state.active,
            done: state.done,
            nextError: state.nextError,
        };
    });

    const change = (event: MouseEvent) => {
        // a click on a control inside title or description is that control's own, not a step switch
        if (view.value && (event.target as Element).closest(focusableSelector) === event.currentTarget) steps?.change(view.value.stepNumber);
    };

    const showIcon = () => !slots.icon || hasSlotContent(slots.icon);
</script>

<template>
    <div
        v-if="view?.type === 'basic'"
        :aria-current="view.active ? 'step' : undefined"
        :class="[
            prefixCls,
            `${prefixCls}-${view.status}`,
            {
                [`${prefixCls}-active`]: view.active,
                [`${prefixCls}-done`]: view.done,
                [`${prefixCls}-hover`]: item.clickable(),
                [`${prefixCls}-clickable`]: item.clickable(),
                [`${prefixCls}-${view.status}-hover`]: item.clickable(),
                [`${stepsClasses.PREFIX}-next-error`]: view.nextError,
            },
            view.classNames?.item,
        ]"
        :role="item.role()"
        :style="view.styles?.item"
        :tabindex="item.tabindex()"
        @click="change"
        @keydown="item.onKeydown($event)"
    >
        <div :class="`${prefixCls}-container`">
            <div :class="`${prefixCls}-left`">
                <span
                    v-if="showIcon()"
                    :class="[
                        `${prefixCls}-icon`,
                        {
                            [`${prefixCls}-custom-icon`]: $slots.icon,
                            [`${prefixCls}-icon-process`]: !$slots.icon && view.status === 'process',
                        },
                        view.classNames?.itemIcon,
                        props.classNames?.icon,
                    ]"
                    :style="[view.styles?.itemIcon, props.styles?.icon]"
                >
                    <slot v-if="$slots.icon" name="icon" />
                    <component :is="view.statusIcon" v-else-if="view.statusIcon" :size="basicIconSize[view.size]" />
                    <span v-else :class="`${prefixCls}-number-icon`">{{ view.label }}</span>
                </span>
            </div>
            <div :class="[`${prefixCls}-content`, view.classNames?.itemContent, props.classNames?.content]" :style="[view.styles?.itemContent, props.styles?.content]">
                <div :class="[`${prefixCls}-title`, view.classNames?.itemTitle, props.classNames?.title]" :style="[view.styles?.itemTitle, props.styles?.title]">
                    <div :class="[`${prefixCls}-title-text`, { [`${prefixCls}-title-text-empty`]: !hasSlotContent($slots.title) }]">
                        <slot name="title" />
                    </div>
                </div>
                <div v-if="hasSlotContent($slots.description)" :class="[`${prefixCls}-description`, view.classNames?.itemDescription, props.classNames?.description]" :style="[view.styles?.itemDescription, props.styles?.description]">
                    <slot name="description" />
                </div>
            </div>
        </div>
    </div>
    <div v-else-if="view?.type === 'nav'" :aria-current="view.active ? 'step' : undefined" :class="[prefixCls, { [`${prefixCls}-active`]: view.active }, view.classNames?.item]" :role="item.role()" :style="view.styles?.item" :tabindex="item.tabindex()" @click="change" @keydown="item.onKeydown($event)">
        <div :class="`${prefixCls}-container`">
            <div :class="[`${prefixCls}-content`, view.classNames?.itemContent, props.classNames?.content]" :style="[view.styles?.itemContent, props.styles?.content]">
                <div :class="[`${prefixCls}-title`, view.classNames?.itemTitle, props.classNames?.title]" :style="[view.styles?.itemTitle, props.styles?.title]">
                    <slot name="title" />
                </div>
            </div>
            <div v-if="view.index !== view.total - 1" :class="[`${prefixCls}-icon`, view.classNames?.itemIcon, props.classNames?.icon]" :style="[view.styles?.itemIcon, props.styles?.icon]">
                <IconChevronRight size="small" />
            </div>
        </div>
    </div>
</template>
