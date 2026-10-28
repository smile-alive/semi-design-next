<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconChainStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    // Upload's add area yields its aria-disabled to a control inside it, so the button carries the state itself.
    const props = defineProps<{ disabled: boolean }>();

    const i18n = useLocale('Chat');
</script>

<template>
    <Button :aria-label="i18n.locale.upload" :class="`${cssClasses.PREFIX_INPUT_BOX}-uploadButton`" :disabled="props.disabled" theme="borderless">
        <template #icon>
            <IconChainStroked size="extra-large" />
        </template>
    </Button>
</template>
