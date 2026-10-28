<script setup lang="ts">
    import { useAttrs, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
    import '@fibrae/semi-foundation/timeline/timeline.scss';
    import { hasClickListener, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import type { TimelineItemProps, TimelineItemSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<TimelineItemProps & /* @vue-ignore */ ElementProps<'li', keyof TimelineItemProps>>(), { type: 'default' });
    defineSlots<TimelineItemSlots>();
    const attrs = useAttrs();

    const extra = useTemplateRef<HTMLElement>('extra');

    const prefixCls = cssClasses.ITEM;

    // shortcut: listeners with .once, .capture or .passive stay on the li, so a click inside extra also triggers them;
    // route them through handleClick (keeping their modifier semantics) when a caller needs a modifier together with the extra guard.
    const isClickKey = (key: string) => key === 'onClick';

    const clickable = () => hasClickListener(attrs);

    const handleClick = (event: MouseEvent) => {
        // Interactive content in this item's own extra must not also trigger the item
        if (extra.value?.contains(event.target as Node)) return;
        for (const listener of [attrs.onClick].flat() as Array<((event: MouseEvent) => void) | undefined>) {
            listener?.(event);
        }
    };
</script>

<template>
    <li v-bind="splitControlAttrs($attrs, isClickKey).root" :class="prefixCls" @click="handleClick">
        <div aria-hidden="true" :class="`${prefixCls}-tail`" />
        <div aria-hidden="true" :class="[`${prefixCls}-head`, { [`${prefixCls}-head-custom`]: hasSlotContent($slots.dot), [`${prefixCls}-head-${props.type}`]: props.type }]" :style="props.color ? { backgroundColor: props.color } : undefined">
            <slot name="dot" />
        </div>
        <div :class="`${prefixCls}-content`">
            <!-- only a clickable item is a keyboard target; extra and time stay outside -->
            <div v-if="clickable()" :class="`${prefixCls}-content-main`" role="button" tabindex="0" @keydown.self.enter.space.prevent="($event.currentTarget as HTMLElement).click()">
                <slot />
            </div>
            <slot v-else />
            <div v-if="hasSlotContent($slots.extra)" ref="extra" :class="`${prefixCls}-content-extra`">
                <slot name="extra" />
            </div>
            <div v-if="hasSlotContent($slots.time)" :class="`${prefixCls}-content-time`">
                <slot name="time" />
            </div>
        </div>
    </li>
</template>
