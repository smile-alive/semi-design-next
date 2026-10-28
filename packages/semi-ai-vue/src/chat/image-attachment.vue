<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Image from '@fibrae/semi-ui-vue/image/index';

    const props = defineProps<{ src?: string; alt?: string; name?: string }>();

    const i18n = useLocale('Chat');

    const { PREFIX_ATTACHMENT } = cssClasses;
</script>

<template>
    <!-- an alt (markdown) or file name (attachment) names the image better than the generic text -->
    <Image :alt="props.alt || props.name || i18n.locale.image" :class="`${PREFIX_ATTACHMENT}-img`" :height="60" :src="props.src" :width="60" />
</template>
