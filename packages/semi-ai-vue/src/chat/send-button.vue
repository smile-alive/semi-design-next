<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconArrowUp } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const props = defineProps<{ disabled: boolean }>();

    const i18n = useLocale('Chat');

    const { PREFIX_INPUT_BOX } = cssClasses;
</script>

<template>
    <Button :aria-label="i18n.locale.send" :class="`${PREFIX_INPUT_BOX}-sendButton`" :disabled="props.disabled" theme="solid" type="primary">
        <template #icon>
            <IconArrowUp :class="`${PREFIX_INPUT_BOX}-sendButton-icon`" size="large" />
        </template>
    </Button>
</template>
