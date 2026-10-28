<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/select/constants';
    import type { ElementProps } from '../_base/element-props';
    import type { SelectOptGroupProps, SelectOptGroupSlots } from './interface';

    /**
     * Inside a Select's default slot a `SelectOptGroup` is only read: its options and title become option records. The
     * Select renders the group title with it.
     */
    defineOptions({ inheritAttrs: false, elementType: 'Select.OptGroup' });
    const props = withDefaults(defineProps<SelectOptGroupProps & /* @vue-ignore */ ElementProps<'div', keyof SelectOptGroupProps>>(), { label: undefined });
    defineSlots<SelectOptGroupSlots>();
</script>

<template>
    <div v-if="$slots.label || props.label || props.label === 0" v-bind="$attrs" :class="cssClasses.PREFIX_GROUP">
        <slot name="label">{{ props.label }}</slot>
    </div>
</template>
