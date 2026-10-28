<script setup lang="ts">
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { useNav } from './context';
    import type { NavItemEmits, NavItemProps, NavItemSlots } from './interface';
    import ItemShell from './item-shell.vue';
    import WrapperOutlet from './wrapper-outlet.vue';

    defineOptions({ inheritAttrs: false, elementType: 'Nav.Item' });

    const props = withDefaults(defineProps<NavItemProps & /* @vue-ignore */ ElementProps<'li', keyof NavItemProps | EmitHandlers<NavItemEmits>>>(), {
        // left undefined so that selectedItems and #wrapper carry only what was passed; the shell applies the fallbacks
        disabled: undefined,
        indent: undefined,
        isCollapsed: undefined,
        level: undefined,
    });

    const emit = defineEmits<NavItemEmits>();
    const slots = defineSlots<NavItemSlots>();

    const ctx = useNav('Nav.Item');

    // content is rendered by ItemShell itself
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'content');
</script>

<template>
    <WrapperOutlet :isInSubNav="ctx.view.value.isInSubNav" :isSubNav="false" :itemProps="props">
        <ItemShell v-bind="{ ...$attrs, ...props }" :isInSubNav="ctx.view.value.isInSubNav" @itemClick="emit('click', $event)">
            <template v-for="name in passedSlots()" #[name]="scope">
                <slot :name="name as keyof NavItemSlots" v-bind="scope" />
            </template>
        </ItemShell>
    </WrapperOutlet>
</template>
