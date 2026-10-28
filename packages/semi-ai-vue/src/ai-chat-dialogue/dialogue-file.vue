<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, getDialogueFileKind, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import type { InputFile } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
    import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
    import { IconCode, IconExcel, IconFile, IconPdf, IconSendMsgStroked, IconVideo, IconWord } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { useAIChatDialogueContext } from './context';

    const props = defineProps<{ file: InputFile; role: string; isLastFile: boolean }>();

    const { view, fileClick, referenceClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const { PREFIX_CONTENT } = cssClasses;
    const { ROLE } = strings;
    const ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo, default: IconFile };
    const realType = computed(() => getFileType(props.file.filename, props.file.fileInstance?.type));
    const kind = computed(() => getDialogueFileKind(realType.value) ?? 'default');
    const icon = computed(() => (kind.value === 'image' ? undefined : ICONS[kind.value]));
    const showReference = computed(() => props.role === ROLE.USER && view.value.showReference);

    const onClick = (e: MouseEvent) => {
        fileClick(props.file);
        if (view.value.disabledFileItemClick) {
            e.preventDefault();
        }
    };

    const onReference = (e: Event) => {
        referenceClick({ name: props.file.filename, url: props.file.file_url });
        // cancel the default: the card link must not open, and Space must not scroll
        e.preventDefault();
    };

    const onReferenceKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            onReference(e);
        }
    };
</script>

<template>
    <a :class="[`${PREFIX_CONTENT}-file`, { [`${PREFIX_CONTENT}-file-last`]: props.isLastFile }]" :href="props.file.file_url" rel="noopener noreferrer" target="_blank" @click="onClick">
        <div :class="[`${PREFIX_CONTENT}-file-icon-wrapper`, `${PREFIX_CONTENT}-file-icon-${kind}`]">
            <component :is="icon" v-if="icon" :class="`${PREFIX_CONTENT}-file-icon`" size="extra-large" />
            <div v-else :class="`${PREFIX_CONTENT}-file-icon`" :style="{ backgroundImage: `url(${props.file.file_url})` }" />
        </div>
        <div :class="`${PREFIX_CONTENT}-file-info`">
            <span
                :class="[
                    `${PREFIX_CONTENT}-file-title`,
                    {
                        [`${PREFIX_CONTENT}-file-title-ellipsis`]: showReference,
                    },
                ]"
            >
                {{ props.file.filename }}
            </span>
            <span :class="`${PREFIX_CONTENT}-file-metadata`">
                <span :class="`${PREFIX_CONTENT}-file-type`">{{ realType }}</span> {{ props.file.size }}
            </span>
        </div>
        <!-- shortcut: role="button" div, as a native button cannot nest in <a>; move it beside the link on rework -->
        <div v-if="showReference" :aria-label="locale.locale.reference" :class="`${PREFIX_CONTENT}-icon-reference`" role="button" tabindex="0" @click="onReference" @keydown="onReferenceKeydown">
            <IconSendMsgStroked />
        </div>
    </a>
</template>
