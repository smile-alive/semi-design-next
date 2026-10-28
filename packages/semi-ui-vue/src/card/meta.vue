<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/card/constants';
    import '@fibrae/semi-foundation/card/card.scss';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { MetaProps, MetaSlots } from './interface';

    const props = defineProps<MetaProps & /* @vue-ignore */ ElementProps<'div', keyof MetaProps>>();
    const slots = defineSlots<MetaSlots>();

    const prefixCls = cssClasses.PREFIX;

    // Slots are not reactive, so presence is decided during render.
    const hasTitle = () => hasSlotContent(slots.title) || Boolean(props.title);
</script>

<template>
    <div :class="`${prefixCls}-meta`">
        <div v-if="hasSlotContent($slots.avatar)" :class="`${prefixCls}-meta-avatar`">
            <slot name="avatar" />
        </div>
        <div v-if="hasTitle() || hasSlotContent($slots.description)" :class="`${prefixCls}-meta-wrapper`">
            <div v-if="hasTitle()" :class="`${prefixCls}-meta-wrapper-title`">
                <slot name="title">{{ props.title }}</slot>
            </div>
            <div v-if="hasSlotContent($slots.description)" :class="`${prefixCls}-meta-wrapper-description`">
                <slot name="description" />
            </div>
        </div>
    </div>
</template>
