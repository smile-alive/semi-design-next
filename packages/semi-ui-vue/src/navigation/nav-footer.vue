<script setup lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import CollapseButton from './collapse-button.vue';
    import { useNav } from './context';
    import type { NavFooterProps, NavFooterSlots } from './interface';

    defineOptions({ elementType: 'Nav.Footer' });
    const props = withDefaults(defineProps<NavFooterProps & /* @vue-ignore */ ElementProps<'div', keyof NavFooterProps>>(), { collapseButton: false });
    const slots = defineSlots<NavFooterSlots>();

    const ctx = useNav('Nav.Footer');

    const prefix = cssClasses.PREFIX;

    // the button only takes an empty footer of a vertical nav; slots are not reactive, so this runs during render
    const showButton = () => !hasSlotContent(slots.default) && (props.collapseButton || Boolean(slots.collapseButton)) && ctx.view.value.mode !== strings.MODE_HORIZONTAL;
</script>

<template>
    <div :class="[`${prefix}-footer`, { [`${prefix}-footer-collapsed`]: ctx.view.value.isCollapsed }]">
        <template v-if="showButton()">
            <slot v-if="$slots.collapseButton" name="collapseButton" />
            <CollapseButton v-else :collapsed="ctx.view.value.isCollapsed" @toggle="ctx.toggleCollapsed">
                <template v-if="$slots.collapseText" #collapseText="slotProps">
                    <slot v-bind="slotProps" name="collapseText" />
                </template>
            </CollapseButton>
        </template>
        <slot v-else />
    </div>
</template>
