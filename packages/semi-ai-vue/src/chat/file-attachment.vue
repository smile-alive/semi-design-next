<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconBriefStroked } from '@fibrae/semi-icons-vue';

    const props = defineProps<{ url?: string; name?: string; size?: string; type?: string }>();

    const { PREFIX_ATTACHMENT } = cssClasses;
</script>

<template>
    <a :class="`${PREFIX_ATTACHMENT}-file`" :href="props.url" rel="noopener noreferrer" target="_blank">
        <IconBriefStroked :class="`${PREFIX_ATTACHMENT}-file-icon`" size="extra-large" />
        <div :class="`${PREFIX_ATTACHMENT}-file-info`">
            <span :class="`${PREFIX_ATTACHMENT}-file-title`">{{ props.name }}</span>
            <span :class="`${PREFIX_ATTACHMENT}-file-metadata`">
                <span :class="`${PREFIX_ATTACHMENT}-file-type`">{{ props.type }}</span
                >{{ props.type ? ' · ' : '' }}{{ props.size }}</span
            >
        </div>
    </a>
</template>
