<script setup lang="ts">
    import type { VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import Button from '@fibrae/semi-ui-vue/button/index';

    const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false });

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
        /** The value after the toggle */
        click: [value: boolean];
    }>();

    defineSlots<{ default?: () => VNode[]; icon?: () => VNode[] }>();

    const prefix = cssClasses.PREFIX;

    const toggle = () => {
        const value = !props.modelValue;
        emit('update:modelValue', value);
        emit('click', value);
    };
</script>

<template>
    <Button
        :aria-pressed="props.modelValue"
        :class="[
            `${prefix}-footer-configure-button`,
            {
                [`${prefix}-footer-configure-button-active`]: props.modelValue,
            },
        ]"
        theme="outline"
        type="tertiary"
        @click="toggle"
    >
        <template v-if="$slots.icon" #icon>
            <slot name="icon" />
        </template>
        <template v-if="$slots.default" #default>
            <slot />
        </template>
    </Button>
</template>
