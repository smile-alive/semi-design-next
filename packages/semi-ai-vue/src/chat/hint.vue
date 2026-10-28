<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconArrowRight } from '@fibrae/semi-icons-vue';
    import type { ChatSlots } from './interface';

    const props = defineProps<{ hints: string[] }>();
    const emit = defineEmits<{ hintClick: [hint: string] }>();
    defineSlots<Pick<ChatSlots, 'hintBox'>>();

    const { PREFIX_HINT } = cssClasses;
</script>

<template>
    <section :class="`${PREFIX_HINT}s`">
        <template v-for="(item, index) in props.hints" :key="index">
            <slot v-if="$slots.hintBox" :content="item" :index="index" name="hintBox" :onHintClick="() => emit('hintClick', item)" />
            <button v-else :class="`${PREFIX_HINT}-item`" type="button" @click="emit('hintClick', item)">
                <span :class="`${PREFIX_HINT}-content`">{{ item }}</span>
                <IconArrowRight :class="`${PREFIX_HINT}-icon`" />
            </button>
        </template>
    </section>
</template>
