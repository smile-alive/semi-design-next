<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/chat/constants';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { TextArea } from '@fibrae/semi-ui-vue/input/index';
    import type { FileItem } from '@fibrae/semi-ui-vue/upload/index';
    import Attachment from './attachment.vue';
    import type { SendHotKey } from './interface';

    const props = defineProps<{
        content: string;
        attachment: FileItem[];
        placeholder?: string;
        sendHotKey: SendHotKey;
    }>();

    const emit = defineEmits<{
        change: [value: string];
        enterPress: [event: KeyboardEvent];
        paste: [event: ClipboardEvent];
        clear: [item: FileItem];
    }>();

    const i18n = useLocale('Chat');

    const textarea = useTemplateRef('textarea');

    const { PREFIX_INPUT_BOX } = cssClasses;
    const AUTOSIZE = { minRows: 1, maxRows: 5 };

    defineExpose({ focus: () => textarea.value?.focus() });
</script>

<template>
    <div :class="`${PREFIX_INPUT_BOX}-inputArea`">
        <TextArea
            ref="textarea"
            :aria-label="i18n.locale.input"
            :autosize="AUTOSIZE"
            :class="`${PREFIX_INPUT_BOX}-textarea`"
            :disabledEnterStartNewLine="props.sendHotKey === strings.SEND_HOT_KEY.ENTER"
            :maxCount="0"
            :modelValue="props.content"
            :placeholder="props.placeholder"
            :showClear="false"
            :showCounter="false"
            :showLineNumber="false"
            @change="emit('change', $event)"
            @enterPress="(...args) => emit('enterPress', ...args)"
            @paste="emit('paste', $event)"
        />
        <Attachment :attachment="props.attachment" @clear="(...args) => emit('clear', ...args)" />
    </div>
</template>
