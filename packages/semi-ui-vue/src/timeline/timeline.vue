<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
    import { getPosCls } from '@fibrae/semi-foundation/timeline/utils';
    import '@fibrae/semi-foundation/timeline/timeline.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import type { TimelineProps, TimelineSlots } from './interface';
    import TimelineItem from './timeline-item.vue';

    const props = withDefaults(defineProps<TimelineProps & /* @vue-ignore */ ElementProps<'ul', keyof TimelineProps>>(), {
        mode: () => semiDefault('Timeline', 'mode', 'left'),
        dataSource: semiGlobalDefault('Timeline', 'dataSource'),
    });

    const slots = defineSlots<TimelineSlots>();

    const prefixCls = cssClasses.PREFIX;

    const childNodes = () => slotNodes(slots.default?.() ?? []);
</script>

<template>
    <ul :class="[prefixCls, { [`${prefixCls}-${props.mode}`]: props.mode }]">
        <template v-if="props.dataSource?.length">
            <TimelineItem v-for="(item, index) in props.dataSource" :key="index" :class="[item.class, getPosCls(props.mode, item.position, index)]" :color="item.color" :position="item.position" :style="item.style" :type="item.type" v-bind="item.onClick ? { onClick: item.onClick } : {}">
                <template #dot>
                    <slot :index="index" :item="item" name="dot" />
                </template>
                <template #time>
                    <slot :index="index" :item="item" name="time">{{ item.time }}</slot>
                </template>
                <template #extra>
                    <slot :index="index" :item="item" name="extra">{{ item.extra }}</slot>
                </template>
                <slot :index="index" :item="item" name="content">{{ item.content }}</slot>
            </TimelineItem>
        </template>
        <template v-else>
            <component :is="node" v-for="([node, key], index) in childNodes()" :key="key" :class="getPosCls(props.mode, node.props?.position, index)" />
        </template>
    </ul>
</template>
