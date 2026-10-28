<script setup lang="ts">
    import { computed, mergeProps } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import type { ElementProps } from '../_base/element-props';
    import SlotFragment from '../_base/slot-fragment';
    import { hasSlotContent } from '../_base/slot-nodes';
    import { useNav } from './context';
    import type { NavHeaderProps, NavHeaderSlots } from './interface';

    defineOptions({ elementType: 'Nav.Header' });
    const props = defineProps<NavHeaderProps & /* @vue-ignore */ ElementProps<'div', keyof NavHeaderProps>>();
    defineSlots<NavHeaderSlots>();

    const ctx = useNav('Nav.Header');

    const prefix = cssClasses.PREFIX;
    const collapsed = computed(() => ctx.view.value.isCollapsed);

    const linkAttrs = computed(() =>
        mergeProps(
            {
                class: `${prefix}-header-link`,
                href: props.link,
                // collapsed, the text is hidden and a Semi icon logo is aria-hidden, so the text still names the link
                'aria-label': collapsed.value && props.text != null ? props.text : undefined,
            },
            { ...props.linkOptions }
        )
    );
</script>

<template>
    <div :class="[`${prefix}-header`, { [`${prefix}-header-collapsed`]: collapsed }]">
        <component :is="typeof props.link === 'string' ? 'a' : SlotFragment" v-bind="typeof props.link === 'string' ? linkAttrs : {}">
            <i v-if="hasSlotContent($slots.logo)" :class="`${prefix}-header-logo`">
                <slot name="logo" />
            </i>
            <span v-if="(props.text != null || $slots.text) && !collapsed" :class="`${prefix}-header-text`">
                <slot name="text">{{ props.text }}</slot>
            </span>
            <slot />
        </component>
    </div>
</template>
