<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconDeleteStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const i18n = useLocale('Chat');
</script>

<template>
    <Button :aria-label="i18n.locale.clear" :class="`${cssClasses.PREFIX_INPUT_BOX}-clearButton`" theme="borderless">
        <template #icon>
            <IconDeleteStroked />
        </template>
    </Button>
</template>
