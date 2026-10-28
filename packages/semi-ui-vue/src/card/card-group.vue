<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/card/constants';
    import '@fibrae/semi-foundation/card/card.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import Space from '../space';
    import type { CardGroupProps, CardGroupSlots } from './interface';

    const props = withDefaults(defineProps<CardGroupProps & /* @vue-ignore */ ElementProps<'div', keyof CardGroupProps>>(), {
        spacing: () => semiDefault('CardGroup', 'spacing', 16),
        type: semiGlobalDefault('CardGroup', 'type'),
        align: semiGlobalDefault('CardGroup', 'align'),
        vertical: () => semiDefault('CardGroup', 'vertical', false),
        wrap: () => semiDefault('CardGroup', 'wrap', true),
    });

    defineSlots<CardGroupSlots>();

    const prefixCls = cssClasses.PREFIX;
    const isGrid = computed(() => props.type === 'grid');
</script>

<template>
    <Space :align="props.align" :class="[`${prefixCls}-group`, { [`${prefixCls}-group-grid`]: isGrid }]" :spacing="isGrid ? 0 : props.spacing" :vertical="props.vertical" :wrap="props.wrap">
        <slot />
    </Space>
</template>
