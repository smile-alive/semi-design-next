<script setup lang="ts">
    import { shallowReactive, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconChevronDown, IconChevronUp, IconStoryStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '@fibrae/semi-ui-vue/_base/element-props';
    import Collapsible from '@fibrae/semi-ui-vue/collapsible/index';
    import type { DialogueStepWidgetProps, DialogueStepWidgetSlots } from '../../interface';

    const props = defineProps<DialogueStepWidgetProps & /* @vue-ignore */ ElementProps<'div', keyof DialogueStepWidgetProps>>();
    defineSlots<DialogueStepWidgetSlots>();

    const openIndexes = shallowReactive(new Set(props.steps.map((_, i) => i)));

    const prefixCls = cssClasses.PREFIX_STEP;
    const { PREFIX_CONTENT } = cssClasses;

    const expandable = (step: DialogueStepWidgetProps['steps'][number]) => Boolean(step.actions?.length);

    const toggleOpen = (index: number) => {
        if (!openIndexes.delete(index)) {
            openIndexes.add(index);
        }
    };

    // streaming sends a new steps array per chunk: only steps added since the last render open; other choices stay
    watch(
        () => props.steps.length,
        (length, previous) => {
            for (let i = previous; i < length; i++) {
                openIndexes.add(i);
            }
        }
    );
</script>

<template>
    <div :class="`${prefixCls}-wrapper`">
        <template v-for="(step, stepIndex) in props.steps" :key="stepIndex">
            <div
                :aria-expanded="expandable(step) ? openIndexes.has(stepIndex) : undefined"
                :class="prefixCls"
                :role="expandable(step) ? 'button' : undefined"
                :tabindex="expandable(step) ? 0 : undefined"
                @click="expandable(step) && toggleOpen(stepIndex)"
                @keydown.enter.space.prevent="expandable(step) && toggleOpen(stepIndex)"
            >
                <div :class="`${prefixCls}-prefix`">
                    <IconStoryStroked v-if="step.status === 'completed'" :class="`${prefixCls}-completed`" />
                    <span v-else :class="`${PREFIX_CONTENT}-loading`">
                        <span :class="`${PREFIX_CONTENT}-loading-item`" />
                        <span :class="`${PREFIX_CONTENT}-loading-item`" />
                        <span :class="`${PREFIX_CONTENT}-loading-item`" />
                    </span>
                </div>
                <div :class="`${prefixCls}-summary`">{{ step.summary }}</div>
                <div v-if="step.actions?.length" :class="`${prefixCls}-suffix`">
                    <IconChevronUp v-if="openIndexes.has(stepIndex)" />
                    <IconChevronDown v-else />
                </div>
            </div>
            <Collapsible :isOpen="openIndexes.has(stepIndex)">
                <div :class="`${prefixCls}-panel`">
                    <div :class="`${prefixCls}-line`" />
                    <div :class="`${prefixCls}-action-wrapper`">
                        <div v-for="(action, index) in step.actions" :key="index" :class="`${prefixCls}-action`">
                            <div :class="`${prefixCls}-action-summary`">{{ action.summary }}</div>
                            <div :class="`${prefixCls}-action-desc`">
                                <slot :index="index" :item="action" name="actionIcon" :step="step" :stepIndex="stepIndex" />
                                {{ action.description }}
                            </div>
                        </div>
                    </div>
                </div>
            </Collapsible>
        </template>
    </div>
</template>
