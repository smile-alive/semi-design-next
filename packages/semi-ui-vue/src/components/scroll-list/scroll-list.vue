<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
    import type { ElementProps } from '../../base/element-props';
    import { semiGlobalDefault } from '../../base/semi-default';
    import { hasSlotContent } from '../../utils/slot-nodes';
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
    <div :class="prefix" :role="namedRole($attrs)">
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
