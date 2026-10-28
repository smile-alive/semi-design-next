<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/dropdown/constants';
    import type { ElementProps } from '../_base/element-props';
    import type { DropdownDividerProps } from './interface';

    defineProps<DropdownDividerProps & /* @vue-ignore */ ElementProps<'li', keyof DropdownDividerProps>>();
</script>

<template>
    <!-- A child of the menu ul, which accepts only li; APG exposes a group boundary of a menu as a separator. -->
    <li :class="`${cssClasses.PREFIX}-divider`" role="separator" />
</template>
