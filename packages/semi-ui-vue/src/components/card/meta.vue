<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/card/constants';
    import '@fibrae/semi-foundation/components/card/card.scss';
    import type { ElementProps } from '../../base/index';
    import { hasSlotContent } from '../../utils/index';
    import type { MetaProps, MetaSlots } from './interface';

    const props = defineProps<MetaProps & /* @vue-ignore */ ElementProps<'div', keyof MetaProps>>();
    const slots = defineSlots<MetaSlots>();

    const prefixCls = cssClasses.PREFIX;

    // Slots are not reactive, so presence is decided during render.
    const hasTitle = () => hasSlotContent(slots.title) || Boolean(props.title);
</script>

<template>
    <div :class="`${prefixCls}-meta`">
        <div v-if="hasSlotContent($slots.avatar)" :class="[`${prefixCls}-meta-avatar`, props.classNames?.avatar]" :style="props.styles?.avatar">
            <slot name="avatar" />
        </div>
        <div v-if="hasTitle() || hasSlotContent($slots.description)" :class="[`${prefixCls}-meta-wrapper`, props.classNames?.section]" :style="props.styles?.section">
            <div v-if="hasTitle()" :class="[`${prefixCls}-meta-wrapper-title`, props.classNames?.title]" :style="props.styles?.title">
                <slot name="title">{{ props.title }}</slot>
            </div>
            <div v-if="hasSlotContent($slots.description)" :class="[`${prefixCls}-meta-wrapper-description`, props.classNames?.description]" :style="props.styles?.description">
                <slot name="description" />
            </div>
        </div>
    </div>
</template>
