<script setup lang="ts">
    import type { HTMLAttributes, VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import SlotFragment from '../_base/slot-fragment';
    import Col from '../grid/col.vue';
    import type { ColProps } from '../grid/interface';
    import Row from '../grid/row.vue';

    const props = withDefaults(
        defineProps<{
            labelAlign?: string;
            labelCol?: ColProps;
            labelPosition?: string;
            mainClass?: HTMLAttributes['class'];
            /** Wraps the columns in their own Row, for a field whose columns the Form does not set */
            row?: boolean;
            wrapperCol?: ColProps;
        }>(),
        { row: undefined }
    );

    defineSlots<{ default?: () => VNode[]; label?: () => VNode[] }>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <template v-if="!(props.labelCol && props.wrapperCol)">
        <slot name="label" />
        <div :class="props.mainClass">
            <slot />
        </div>
    </template>
    <component :is="props.row ? Row : SlotFragment" v-else>
        <!-- a top label needs an overflow hidden wrapper, or it lays out horizontally -->
        <component :is="props.labelPosition === 'top' ? 'div' : SlotFragment" :style="props.labelPosition === 'top' ? { overflow: 'hidden' } : undefined">
            <Col v-bind="props.labelCol" :class="{ [`${prefix}-col-${props.labelAlign}`]: props.labelAlign }">
                <slot name="label" />
            </Col>
        </component>
        <Col v-bind="props.wrapperCol">
            <div :class="props.mainClass">
                <slot />
            </div>
        </Col>
    </component>
</template>
