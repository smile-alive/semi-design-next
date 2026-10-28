<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
    import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import { semiGlobalDefault } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { ScrollListProps, ScrollListSlots } from './interface';

    defineOptions({ name: 'ScrollList' });

    const props = withDefaults(defineProps<ScrollListProps & /* @vue-ignore */ ElementProps<'div', keyof ScrollListProps>>(), {
        bodyHeight: semiGlobalDefault('ScrollList', 'bodyHeight'),
        footer: semiGlobalDefault('ScrollList', 'footer'),
        header: semiGlobalDefault('ScrollList', 'header'),
    });

    const slots = defineSlots<ScrollListSlots>();

    const prefix = cssClasses.PREFIX;

    const hasHeader = () => (slots.header ? hasSlotContent(slots.header) : Boolean(props.header));

    const hasFooter = () => (slots.footer ? hasSlotContent(slots.footer) : Boolean(props.footer));

    // A style binding does not add px to numbers as React does; 0 leaves the stylesheet height, as in React.
    const bodyHeight = (value?: number | string) => (typeof value === 'number' ? (value ? `${value}px` : '') : value || '');
</script>

<template>
    <div :class="prefix" :role="groupRole($attrs)">
        <div v-if="hasHeader()" :class="`${prefix}-header`">
            <div :class="`${prefix}-header-title`" x-semi-prop="header">
                <slot name="header">{{ props.header }}</slot>
            </div>
            <div :class="`${prefix}-line`" />
        </div>
        <div :class="`${prefix}-body`" :style="{ height: bodyHeight(props.bodyHeight) }" x-semi-prop="children">
            <slot />
        </div>
        <div v-if="hasFooter()" :class="`${prefix}-footer`" x-semi-prop="footer">
            <slot name="footer">{{ props.footer }}</slot>
        </div>
    </div>
</template>
