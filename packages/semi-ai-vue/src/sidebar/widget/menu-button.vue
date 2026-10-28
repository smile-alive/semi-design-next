<script setup lang="ts">
    import type { VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import Button from '@fibrae/semi-ui-vue/button/index';

    // elementType lets a Dropdown tell this is a button and put aria-haspopup and aria-expanded on it
    defineOptions({ elementType: 'Button' });
    const props = withDefaults(defineProps<{ active?: boolean }>(), { active: false });
    defineSlots<{ default?: () => VNode[]; icon?: () => VNode[] }>();

    const prefix = cssClasses.FILE;
</script>

<template>
    <Button :class="[`${prefix}-menu-bar-btn`, { [`${prefix}-menu-bar-btn-active`]: props.active }]" theme="borderless" type="tertiary">
        <template v-if="$slots.icon" #icon>
            <slot name="icon" />
        </template>
        <slot />
    </Button>
</template>
