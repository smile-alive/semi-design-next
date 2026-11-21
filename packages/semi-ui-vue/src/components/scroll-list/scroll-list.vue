<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
    import { type ElementProps, semiGlobalDefault } from '../../base/index';
    import { hasSlotContent } from '../../utils/index';
    import type { ScrollListProps, ScrollListSlots } from './interface';

    defineOptions({ name: 'ScrollList' });

    const props = withDefaults(defineProps<ScrollListProps & /* @vue-ignore */ ElementProps<'div', keyof ScrollListProps>>(), {
        bodyHeight: semiGlobalDefault('ScrollList', 'bodyHeight'),
        classNames: semiGlobalDefault('ScrollList', 'classNames'),
        footer: semiGlobalDefault('ScrollList', 'footer'),
        header: semiGlobalDefault('ScrollList', 'header'),
        styles: semiGlobalDefault('ScrollList', 'styles'),
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
        <div v-if="hasHeader()" :class="[`${prefix}-header`, props.classNames?.header]" :style="props.styles?.header">
            <div :class="[`${prefix}-header-title`, props.classNames?.title]" :style="props.styles?.title" x-semi-prop="header">
                <slot name="header">{{ props.header }}</slot>
            </div>
            <div :class="`${prefix}-line`" />
        </div>
        <div :class="[`${prefix}-body`, props.classNames?.body]" :style="[{ height: bodyHeight(props.bodyHeight) }, props.styles?.body]" x-semi-prop="children">
            <slot />
        </div>
        <div v-if="hasFooter()" :class="[`${prefix}-footer`, props.classNames?.footer]" :style="props.styles?.footer" x-semi-prop="footer">
            <slot name="footer">{{ props.footer }}</slot>
        </div>
    </div>
</template>
