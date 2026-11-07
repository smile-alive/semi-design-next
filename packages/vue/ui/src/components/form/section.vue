<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import type { ElementProps } from '../../base/element-props';
    import { hasSlotContent } from '../../utils/slot-nodes';
    import type { FormSectionSlots } from './interface';

    defineProps</* @vue-ignore */ ElementProps<'fieldset'>>();
    defineSlots<FormSectionSlots>();

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <fieldset :class="`${prefix}-section`">
        <!-- an empty legend would still draw its divider -->
        <legend v-if="hasSlotContent($slots.text)" :class="`${prefix}-section-text`">
            <slot name="text" />
        </legend>
        <slot />
    </fieldset>
</template>
