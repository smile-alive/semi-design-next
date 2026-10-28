<script setup lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import { getFileType, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { isUploadProgressVisible } from '@fibrae/semi-ai-foundation/upload-status';
    import { IconAlertCircle, IconClear } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Progress from '@fibrae/semi-ui-vue/progress/index';
    import type { FileItem } from '@fibrae/semi-ui-vue/upload/index';
    import FileAttachment from './file-attachment.vue';
    import ImageAttachment from './image-attachment.vue';

    const props = defineProps<{ attachment: FileItem[] }>();
    const emit = defineEmits<{ clear: [item: FileItem] }>();

    const i18n = useLocale('Chat');

    const { PREFIX_ATTACHMENT } = cssClasses;
    const { FILE_STATUS } = strings;
    const failed: string[] = [FILE_STATUS.UPLOAD_FAIL, FILE_STATUS.VALID_FAIL];

    const mimeOf = (item: FileItem) => item.fileInstance?.type;
</script>

<template>
    <div :class="PREFIX_ATTACHMENT">
        <div v-for="item in props.attachment" :key="item.uid" :class="`${PREFIX_ATTACHMENT}-item`">
            <ImageAttachment v-if="isImageFile(item.name, mimeOf(item))" :name="item.name" :src="item.url" />
            <FileAttachment v-else :name="item.name" :size="item.size" :type="getFileType(item.name, mimeOf(item))" :url="item.url" />
            <button :aria-label="i18n.locale.removeAttachment" :class="`${PREFIX_ATTACHMENT}-clear`" type="button" @click="emit('clear', item)">
                <IconClear size="large" />
            </button>
            <Progress v-if="isUploadProgressVisible(item)" :aria-label="i18n.locale.uploadProgress" :class="`${PREFIX_ATTACHMENT}-process`" :percent="item.percent" size="small" type="circle" :width="30" />
            <IconAlertCircle v-if="failed.includes(item.status)" :class="`${PREFIX_ATTACHMENT}-fail`" />
        </div>
    </div>
</template>
