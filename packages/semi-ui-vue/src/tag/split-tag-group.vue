<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
    import '@fibrae/semi-foundation/tag/tag.scss';
    import type { ElementProps } from '../_base/element-props';
    import type { SplitTagGroupProps, SplitTagGroupSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    defineProps<SplitTagGroupProps & /* @vue-ignore */ ElementProps<'div', keyof SplitTagGroupProps>>();
    defineSlots<SplitTagGroupSlots>();
</script>

<template>
    <div v-bind="$attrs" :class="`${cssClasses.PREFIX}-split`" role="group">
        <slot />
    </div>
</template>
