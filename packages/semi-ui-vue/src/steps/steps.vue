<script setup lang="ts">
    import { computed, Text } from 'vue';
    import { stepsClasses } from '@fibrae/semi-foundation/steps/constants';
    import '@fibrae/semi-foundation/steps/steps.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, useSemiGlobal } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import { Col, Row } from '../grid';
    import { provideStepsContext } from './context';
    import type { StepsProps, StepsSlots } from './interface';
    import StepProvider from './step-provider.vue';

    const props = withDefaults(defineProps<StepsProps & /* @vue-ignore */ ElementProps<'div', keyof StepsProps>>(), {
        type: () => semiDefault('Steps', 'type', 'fill'),
        current: () => semiDefault('Steps', 'current', 0),
        initial: () => semiDefault('Steps', 'initial', 0),
        direction: () => semiDefault('Steps', 'direction', 'horizontal'),
        status: () => semiDefault('Steps', 'status', 'process'),
        size: () => semiDefault('Steps', 'size', 'default'),
        hasLine: () => semiDefault('Steps', 'hasLine', true),
        prefixCls: () => semiDefault('Steps', 'prefixCls', stepsClasses.PREFIX),
        onChange: undefined,
        'onUpdate:current': undefined,
    });

    const slots = defineSlots<StepsSlots>();

    const semi = useSemiGlobal();

    const onChange = computed(() => props.onChange ?? readSemiDefault(semi, 'Steps', 'onChange'));
    const onUpdateCurrent = computed(() => props['onUpdate:current'] ?? readSemiDefault(semi, 'Steps', 'onUpdate:current'));

    const rootClass = computed(() => {
        const prefixCls = props.prefixCls;
        const sized = { [`${prefixCls}-${props.size}`]: props.size !== 'default' };
        switch (props.type) {
            case 'basic':
                return [`${prefixCls}-basic`, `${prefixCls}-${props.direction}`, sized, { [`${prefixCls}-hasline`]: props.hasLine }];
            case 'nav':
                return [`${prefixCls}-nav`, sized];
            default:
                return [prefixCls, `${prefixCls}-${props.direction}`];
        }
    });

    provideStepsContext({
        view: computed(() => ({
            type: props.type,
            size: props.size,
            current: props.current,
            initial: props.initial,
            status: props.status,
            prefixCls: props.prefixCls,
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
    <div :class="rootClass" :role="groupRole($attrs)">
        <template v-for="(nodes, group) in [stepNodes()]" :key="group">
            <Row v-if="props.type === 'fill'" justify="start" type="flex">
                <Col v-for="([node, key], index) in nodes" :key="key" :style="props.direction === 'vertical' ? undefined : { width: `${100 / nodes.length}%` }">
                    <StepProvider :index="index" :total="nodes.length">
                        <component :is="node" />
                    </StepProvider>
                </Col>
            </Row>
            <template v-else>
                <StepProvider v-for="([node, key], index) in nodes" :key="key" :index="index" :total="nodes.length">
                    <component :is="node" />
                </StepProvider>
            </template>
        </template>
    </div>
</template>
