<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { AIChatDialogueSlots } from './interface';

    const props = defineProps<{ hints: string[]; selecting: boolean }>();
    const emit = defineEmits<{ hintClick: [hint: string] }>();
    defineSlots<Pick<AIChatDialogueSlots, 'hintBox'>>();

    const { PREFIX_HINT } = cssClasses;
</script>

<template>
    <section :class="[`${PREFIX_HINT}s`, { [`${PREFIX_HINT}s-selecting`]: props.selecting }]">
        <template v-for="(item, index) in props.hints" :key="index">
            <slot v-if="$slots.hintBox" :content="item" :index="index" name="hintBox" :onHintClick="() => emit('hintClick', item)" />
            <!-- .prevent: Space would scroll, and Enter would press the button the hint click moved focus to -->
            <div v-else :class="`${PREFIX_HINT}-item`" role="button" tabindex="0" @click="emit('hintClick', item)" @keydown.enter.space.prevent="emit('hintClick', item)">
                <div :class="`${PREFIX_HINT}-content`">{{ item }}</div>
            </div>
        </template>
    </section>
</template>
