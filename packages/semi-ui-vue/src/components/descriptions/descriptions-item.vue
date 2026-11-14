<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/descriptions/constants';
    import '@fibrae/semi-foundation/components/descriptions/descriptions.scss';
    import { type ElementProps, SlotFragment } from '../../base/index';
    import { useDescriptionsContext } from './context';
    import type { DescriptionsItemProps, DescriptionsItemSlots } from './interface';

    // horizontal layout renders cells only: attrs have no element to land on
    defineOptions({ inheritAttrs: false, elementType: 'Descriptions.Item' });
    const props = withDefaults(defineProps<DescriptionsItemProps & /* @vue-ignore */ ElementProps<'tr', keyof DescriptionsItemProps>>(), { hidden: false });
    defineSlots<DescriptionsItemSlots>();

    const injected = useDescriptionsContext();

    const horizontal = computed(() => injected?.value.layout === 'horizontal');
    const plain = computed(() => injected?.value.align === 'plain');
    const prefixCls = cssClasses.PREFIX;
</script>

<template>
    <component :is="horizontal ? SlotFragment : 'tr'" v-if="!props.hidden" v-bind="horizontal ? {} : $attrs">
        <td v-if="plain" :class="`${prefixCls}-item`" :colspan="props.span || 1">
            <span :class="[`${prefixCls}-key`, props.classNames?.key]" :style="props.styles?.key"><slot name="itemKey" />:</span>
            <span :class="`${prefixCls}-value`">
                <slot />
            </span>
        </td>
        <template v-else>
            <th :class="[`${prefixCls}-item`, `${prefixCls}-item-th`]">
                <span :class="[`${prefixCls}-key`, props.classNames?.key]" :style="props.styles?.key">
                    <slot name="itemKey" />
                </span>
            </th>
            <td :class="[`${prefixCls}-item`, `${prefixCls}-item-td`]" :colspan="props.span ? props.span * 2 - 1 : 1">
                <span :class="`${prefixCls}-value`">
                    <slot />
                </span>
            </td>
        </template>
    </component>
</template>
