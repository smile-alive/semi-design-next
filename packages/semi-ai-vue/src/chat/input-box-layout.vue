<script setup lang="ts">
    import type { VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';

    const emit = defineEmits<{ innerClick: [] }>();
    defineSlots<{ clear?: () => VNode[]; upload?: () => VNode[]; input?: () => VNode[]; send?: () => VNode[] }>();

    const { PREFIX_INPUT_BOX } = cssClasses;
</script>

<template>
    <div :class="PREFIX_INPUT_BOX">
        <div :class="`${PREFIX_INPUT_BOX}-inner`" @click="emit('innerClick')">
            <slot name="clear" />
            <div :class="`${PREFIX_INPUT_BOX}-container`">
                <slot name="upload" />
                <slot name="input" />
                <slot name="send" />
            </div>
        </div>
    </div>
</template>
