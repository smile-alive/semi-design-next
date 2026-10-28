<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { IconPaperclip } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    // aria-disabled, not disabled: stays focusable so the upload tip reaches the keyboard
    const props = defineProps<{ disabled: boolean }>();

    const i18n = useLocale('AIChatInput');

    const prefix = cssClasses.PREFIX;
</script>

<template>
    <!-- Upload's AddArea yields its role and tabindex to a control inside it, so this button is the only Tab stop -->
    <button :aria-disabled="props.disabled ? 'true' : undefined" :aria-label="i18n.locale.upload" :class="[`${prefix}-footer-action-button`, `${prefix}-footer-action-upload`]" type="button">
        <IconPaperclip />
    </button>
</template>
