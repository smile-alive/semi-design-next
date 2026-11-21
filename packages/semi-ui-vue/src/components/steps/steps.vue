<script setup lang="ts">
    import { computed, Text } from 'vue';
    import { stepsClasses } from '@fibrae/semi-foundation/components/steps/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/steps/steps.scss';
    import { type ElementProps, semiDefault, semiGlobalDefault, readSemiDefault, useSemiGlobal } from '../../base/index';
    import { slotNodes } from '../../utils/index';
    import { provideStepsContext } from './context';
    import type { StepsProps, StepsSlots } from './interface';
    import StepProvider from './step-provider.vue';

    const props = withDefaults(defineProps<StepsProps & /* @vue-ignore */ ElementProps<'div', keyof StepsProps>>(), {
        type: () => semiDefault('Steps', 'type', 'basic'),
        current: () => semiDefault('Steps', 'current', 0),
        initial: () => semiDefault('Steps', 'initial', 0),
        direction: () => semiDefault('Steps', 'direction', 'horizontal'),
        status: () => semiDefault('Steps', 'status', 'process'),
        size: () => semiDefault('Steps', 'size', 'default'),
        hasLine: () => semiDefault('Steps', 'hasLine', true),
        classNames: semiGlobalDefault('Steps', 'classNames'),
        styles: semiGlobalDefault('Steps', 'styles'),
        onChange: undefined,
        'onUpdate:current': undefined,
    });

    const slots = defineSlots<StepsSlots>();

    const semi = useSemiGlobal();

    const onChange = computed(() => props.onChange ?? readSemiDefault(semi, 'Steps', 'onChange'));
    const onUpdateCurrent = computed(() => props['onUpdate:current'] ?? readSemiDefault(semi, 'Steps', 'onUpdate:current'));

    const rootClass = computed(() => {
        const prefixCls = stepsClasses.PREFIX;
        const sized = { [`${prefixCls}-${props.size}`]: props.size !== 'default' };
        switch (props.type) {
            case 'nav':
                return [`${prefixCls}-nav`, sized];
            default:
                return [`${prefixCls}-basic`, `${prefixCls}-${props.direction}`, sized, { [`${prefixCls}-hasline`]: props.hasLine }];
        }
    });

    provideStepsContext({
        view: computed(() => ({
            type: props.type,
            size: props.size,
            current: props.current,
            initial: props.initial,
            status: props.status,
            classNames: props.classNames,
            styles: props.styles,
            clickable: Boolean(onChange.value || onUpdateCurrent.value),
        })),
        change(stepNumber) {
            if (stepNumber === props.current) return;
            onChange.value?.(stepNumber);
            onUpdateCurrent.value?.(stepNumber);
        },
    });

    // Every element takes a position in order and a wrapped Step reads it through StepProvider, so no node is matched by
    // type; text has no element to hold a position
    const stepNodes = () => slotNodes(slots.default?.() ?? []).filter(([node]) => node.type !== Text);
</script>

<template>
    <div :class="rootClass" :role="namedRole($attrs)">
        <template v-for="(nodes, group) in [stepNodes()]" :key="group">
            <StepProvider v-for="([node, key], index) in nodes" :key="key" :index="index" :total="nodes.length">
                <component :is="node" />
            </StepProvider>
        </template>
    </div>
</template>
