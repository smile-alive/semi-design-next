<script setup lang="ts">
    import { Text, computed, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/divider/constants';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/divider/divider.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import type { DividerProps, DividerSlots } from './interface';

    const props = withDefaults(defineProps<DividerProps & /* @vue-ignore */ ElementProps<'div', keyof DividerProps>>(), {
        layout: () => semiDefault('Divider', 'layout', 'horizontal'),
        align: () => semiDefault('Divider', 'align', 'center'),
        dashed: semiGlobalDefault('Divider', 'dashed'),
        margin: semiGlobalDefault('Divider', 'margin'),
    });

    const slots = defineSlots<DividerSlots>();

    const prefixCls = `${cssClasses.PREFIX}-divider`;

    const marginStyle = computed((): StyleValue => {
        if (props.margin === undefined) return {};
        const margin = toCssLength(props.margin);
        return props.layout === 'vertical' ? { marginLeft: margin, marginRight: margin } : { marginTop: margin, marginBottom: margin };
    });

    // Root attrs cannot share the template's one-item v-for, so content() (and the slot) runs once per use
    const content = (): KeyedNode[] => (props.layout === 'horizontal' ? slotNodes(slots.default?.() ?? []).filter(([node]) => !(node.type === Text && node.children === '')) : []);

    const isText = (nodes: KeyedNode[]) => nodes.every(([node]) => node.type === Text);

    const rootClass = () => {
        const withText = content().length > 0;
        return [
            prefixCls,
            {
                [`${prefixCls}-horizontal`]: props.layout === 'horizontal',
                [`${prefixCls}-vertical`]: props.layout === 'vertical',
                [`${prefixCls}-dashed`]: props.dashed,
                [`${prefixCls}-with-text`]: withText,
                [`${prefixCls}-with-text-${props.align}`]: withText,
            },
        ];
    };
</script>

<template>
    <div :aria-orientation="props.layout === 'vertical' ? 'vertical' : undefined" :class="rootClass()" :role="content().length ? undefined : 'separator'" :style="marginStyle">
        <template v-for="(nodes, i) in [content()]" :key="i">
            <span v-if="nodes.length && isText(nodes)" :class="`${prefixCls}_inner-text`" x-semi-prop="children">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </span>
            <template v-else>
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </template>
        </template>
    </div>
</template>
