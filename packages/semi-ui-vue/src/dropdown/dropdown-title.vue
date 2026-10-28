<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import type { ElementProps } from '../_base/element-props';
    import { useDropdownContext } from './context';
    import type { DropdownTitleProps, DropdownTitleSlots } from './interface';

    defineProps<DropdownTitleProps & /* @vue-ignore */ ElementProps<'li', keyof DropdownTitleProps>>();
    defineSlots<DropdownTitleSlots>();

    const ctx = useDropdownContext();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <!-- A child of the menu ul, which accepts only li; presentation keeps it out of the menu's items. -->
    <li :class="[`${prefix}-title`, { [`${prefix}-title-withTick`]: ctx?.view.value.showTick }]" role="presentation">
        <slot />
    </li>
</template>
