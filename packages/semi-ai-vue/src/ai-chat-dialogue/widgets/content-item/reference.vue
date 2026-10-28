<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, getDialogueFileKind } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { Reference } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getFileSuffix, isImageFile } from '@fibrae/semi-ai-foundation/file-suffix';
    import { IconCode, IconExcel, IconPdf, IconSendMsgStroked, IconVideo, IconWord } from '@fibrae/semi-icons-vue';
    import Image from '@fibrae/semi-ui-vue/image/index';

    const props = defineProps<{ references: Reference[] }>();

    const prefixCls = cssClasses.PREFIX_REFERENCES;
    const referencePrefixCls = cssClasses.PREFIX_REFERENCE;

    // A thumbnail replaces the icon for images, so the image kind has none
    const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo };

    const items = computed(() =>
        props.references.map((reference) => {
            const kind = getDialogueFileKind(getFileSuffix(reference.name));
            return { reference, kind, icon: kind && kind !== 'image' ? ICONS[kind] : undefined };
        })
    );
</script>

<template>
    <div :class="prefixCls">
        <!-- Known limitation: background color and items per row are not specified by design yet -->
        <div v-for="{ reference, kind, icon } in items" :key="reference.id" :class="referencePrefixCls">
            <IconSendMsgStroked />
            <span :class="`${referencePrefixCls}-content`">
                <span v-if="icon" :class="[`${referencePrefixCls}-icon`, `${referencePrefixCls}-icon-${kind}`]">
                    <component :is="icon" size="small" />
                </span>
                <Image v-if="reference.url && reference.name && isImageFile(reference.name, reference.fileInstance?.type)" alt="" :class="`${referencePrefixCls}-img`" :height="16" :src="reference.url" :width="16" />
                <span :class="`${referencePrefixCls}-name`">{{ reference.name || reference.content }}</span>
            </span>
        </div>
    </div>
</template>
