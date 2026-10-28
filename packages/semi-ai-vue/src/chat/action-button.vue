<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconCopyStroked, IconLikeThumb, IconRedoStroked, IconThumbUpStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const props = defineProps<{ name: 'copy' | 'like' | 'dislike' | 'reset'; active: boolean }>();

    const i18n = useLocale('Chat');

    const { PREFIX_CHAT_BOX_ACTION } = cssClasses;

    const label = computed(() => {
        const { locale } = i18n.value;
        return { copy: locale.copy, like: locale.like, dislike: locale.dislike, reset: locale.regenerate }[props.name];
    });
</script>

<template>
    <Button :aria-label="label" :aria-pressed="props.name === 'like' || props.name === 'dislike' ? props.active : undefined" :class="`${PREFIX_CHAT_BOX_ACTION}-btn`" theme="borderless" type="tertiary">
        <template #icon>
            <IconCopyStroked v-if="props.name === 'copy'" />
            <IconRedoStroked v-else-if="props.name === 'reset'" :class="`${PREFIX_CHAT_BOX_ACTION}-icon-redo`" />
            <component :is="props.active ? IconLikeThumb : IconThumbUpStroked" v-else :class="{ [`${PREFIX_CHAT_BOX_ACTION}-icon-flip`]: props.name === 'dislike' }" />
        </template>
    </Button>
</template>
