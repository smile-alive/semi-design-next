<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { IconArrowUp, IconStop } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const props = defineProps<{ generating: boolean; canSend: boolean }>();

    const i18n = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <!-- not disabled: keeps focus, and the foundation already ignores the click -->
    <button
        :aria-disabled="!props.generating && !props.canSend ? 'true' : undefined"
        :aria-label="props.generating ? i18n.locale.stop : i18n.locale.send"
        :class="[
            `${prefix}-footer-action-button`,
            {
                [`${prefix}-footer-action-send`]: !props.generating,
                [`${prefix}-footer-action-stop`]: props.generating,
                [`${prefix}-footer-action-send-disabled`]: !props.generating && !props.canSend,
            },
        ]"
        type="button"
    >
        <IconStop v-if="props.generating" />
        <IconArrowUp v-else />
    </button>
</template>
