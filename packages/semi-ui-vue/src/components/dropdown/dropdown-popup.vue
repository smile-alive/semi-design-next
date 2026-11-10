<script setup lang="ts">
    import type { StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/dropdown/constants';
    import { provideDropdownContext, type DropdownContext } from './context';

    const props = defineProps<{
        context: DropdownContext;
        contentClass?: string | unknown[];
        popStyle?: StyleValue;
    }>();

    defineSlots<{ default?: () => unknown }>();

    // Not provided in Dropdown: the trigger renders under it too and must read the enclosing menu's context.
    provideDropdownContext(props.context);
</script>

<template>
    <div :class="[cssClasses.PREFIX, props.contentClass]" :style="props.popStyle">
        <div :class="`${cssClasses.PREFIX}-content`" x-semi-prop="content">
            <slot />
        </div>
    </div>
</template>
