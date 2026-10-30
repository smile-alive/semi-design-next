<script setup lang="ts">
    import { useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import { getItemRole } from '@fibrae/semi-foundation/dropdown/menu-foundation';
    import { IconTick } from '@fibrae/semi-icons-vue';
    import { isClickListenerKey } from '../_base/control-attrs';
    import type { ElementProps } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import { useDropdownContext } from './context';
    import type { DropdownItemProps, DropdownItemSlots } from './interface';

    defineOptions({ inheritAttrs: false, elementType: 'Dropdown.Item' });

    const props = withDefaults(defineProps<DropdownItemProps & /* @vue-ignore */ ElementProps<'li', keyof DropdownItemProps>>(), {
        active: false,
        disabled: false,
        showTick: undefined,
        type: undefined,
    });

    defineSlots<DropdownItemSlots>();
    const attrs = useAttrs();

    const ctx = useDropdownContext();

    const prefix = cssClasses.PREFIX;

    const call = (listener: unknown, event: MouseEvent) => {
        for (const fn of [listener].flat()) {
            if (typeof fn === 'function') fn(event);
        }
    };

    const passthrough = ({ onClick: _click, onMousedown: _mousedown, ...rest }: Record<string, unknown>) => {
        if (!props.disabled) return rest;
        const { onMouseenter: _enter, onMouseleave: _leave, onContextmenu: _menu, ...enabledOnly } = rest;
        return Object.fromEntries(Object.entries(enabledOnly).filter(([key]) => !isClickListenerKey(key)));
    };

    const realShowTick = () => (ctx ? ctx.view.value.showTick : props.showTick);

    const role = () => getItemRole(ctx?.view.value.selectionMode, realShowTick());

    const topLevel = () => ctx?.view.value.menuDepth === 1;

    // Nested or standalone items click on mousedown: a click-triggered outer popup closes on it, unmounting the submenu
    // before the click.
    const mousedown = (event: MouseEvent) => {
        call(attrs.onMousedown, event);
        if (!props.disabled && !topLevel() && event.button === 0) call(attrs.onClick, event);
    };

    const click = (event: MouseEvent) => {
        if (!props.disabled && (topLevel() || event.detail === 0)) call(attrs.onClick, event);
    };
</script>

<template>
    <li
        v-bind="passthrough($attrs)"
        :aria-checked="role() === 'menuitem' ? undefined : props.active"
        :aria-disabled="props.disabled"
        :class="[`${prefix}-item`, { [`${prefix}-item-disabled`]: props.disabled, [`${prefix}-item-withTick`]: realShowTick(), [`${prefix}-item-${props.type}`]: props.type, [`${prefix}-item-active`]: props.active }]"
        :role="role()"
        :tabindex="-1"
        @click="click"
        @mousedown="mousedown"
    >
        <!-- every item renders a tick (transparent when inactive), so it stays out of the item's name -->
        <IconTick v-if="realShowTick()" :style="props.active ? undefined : { color: 'transparent' }" />
        <div v-if="hasSlotContent($slots.icon)" :class="`${prefix}-item-icon`">
            <slot name="icon" />
        </div>
        <slot />
    </li>
</template>
