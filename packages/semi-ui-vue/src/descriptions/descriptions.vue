<script setup lang="ts">
    import { computed, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/descriptions/constants';
    import DescriptionsFoundation from '@fibrae/semi-foundation/descriptions/foundation';
    import '@fibrae/semi-foundation/descriptions/descriptions.scss';
    import type { ElementProps } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import semiDefault from '../_base/semi-default';
    import slotNodes from '../_base/slot-nodes';
    import { provideDescriptionsContext } from './context';
    import DescriptionsItem from './descriptions-item.vue';
    import type { DescriptionsData, DescriptionsProps, DescriptionsSlots } from './interface';

    type Column = { kind: 'data'; key: string; data: DescriptionsData; index: number; hidden?: boolean; span?: number } | { kind: 'node'; key: string; node: VNode; hidden: boolean; span?: number };

    const props = withDefaults(defineProps<DescriptionsProps & /* @vue-ignore */ ElementProps<'div', keyof DescriptionsProps>>(), {
        align: () => semiDefault('Descriptions', 'align', 'center'),
        row: () => semiDefault('Descriptions', 'row', false),
        size: () => semiDefault('Descriptions', 'size', 'medium'),
        data: () => semiDefault('Descriptions', 'data', []),
        layout: () => semiDefault('Descriptions', 'layout', 'vertical'),
        column: () => semiDefault('Descriptions', 'column', 3),
    });

    const slots = defineSlots<DescriptionsSlots>();

    const prefixCls = cssClasses.PREFIX;

    provideDescriptionsContext(computed(() => ({ align: props.align, layout: props.layout })));

    // vnode props hold what the author wrote: `hidden` shorthand is '' and `span="3"` is a string
    const isTrue = (value: unknown) => value === '' || value === true;

    const toSpan = (value: unknown) => (value == null ? undefined : Number(value));

    const horizontalRows = () => {
        const columns: Column[] = props.data.length
            ? props.data.map((data, index) => ({
                  kind: 'data',
                  key: String(index),
                  data,
                  index,
                  hidden: data.hidden,
                  span: data.span,
              }))
            : slotNodes(slots.default?.() ?? [])
                  .filter(([node]) => elementType(node) === 'Descriptions.Item')
                  .map(([node, key]) => ({
                      kind: 'node',
                      key,
                      node,
                      hidden: isTrue(node.props?.hidden),
                      span: toSpan(node.props?.span),
                  }));
        return DescriptionsFoundation.getHorizontalList(columns, props.column);
    };
</script>

<template>
    <div :class="[prefixCls, { [`${prefixCls}-${props.align}`]: !props.row, [`${prefixCls}-double`]: props.row, [`${prefixCls}-double-${props.size}`]: props.row, [`${prefixCls}-horizontal`]: props.layout === 'horizontal', [`${prefixCls}-vertical`]: props.layout === 'vertical' }]">
        <table>
            <tbody>
                <template v-if="props.layout === 'horizontal'">
                    <tr v-for="(columns, rowIndex) in horizontalRows()" :key="rowIndex">
                        <template v-for="column in columns" :key="column.key">
                            <DescriptionsItem v-if="column.kind === 'data'" :keyStyle="column.data.keyStyle" :span="column.span">
                                <template #itemKey>
                                    <slot :index="column.index" :item="column.data" name="itemKey">{{ column.data.key }}</slot>
                                </template>
                                <slot :index="column.index" :item="column.data" name="value">{{ column.data.value }}</slot>
                            </DescriptionsItem>
                            <template v-else>
                                <component :is="column.node" :span="column.span" />
                            </template>
                        </template>
                    </tr>
                </template>
                <template v-else-if="props.data.length">
                    <DescriptionsItem v-for="(item, index) in props.data" :key="index" :hidden="item.hidden" :keyStyle="item.keyStyle" :span="item.span">
                        <template #itemKey>
                            <slot :index="index" :item="item" name="itemKey">{{ item.key }}</slot>
                        </template>
                        <slot :index="index" :item="item" name="value">{{ item.value }}</slot>
                    </DescriptionsItem>
                </template>
                <slot v-else />
            </tbody>
        </table>
    </div>
</template>
