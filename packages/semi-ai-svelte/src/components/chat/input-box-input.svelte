<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/components/chat/constants';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import TextArea from '@fibrae/semi-ui-svelte/input/textarea.svelte';
    import type { FileItem } from '@fibrae/semi-ui-svelte/upload/interface';
    import Attachment from './attachment.svelte';
    import type { SendHotKey } from './interface.js';

    interface InputBoxInputProps {
        content: string;
        attachment: FileItem[];
        placeholder?: string;
        sendHotKey: SendHotKey;
        textareaClass?: ClassValue;
        textareaStyle?: string;
        onChange: (value: string) => void;
        onEnterPress: (event: KeyboardEvent) => void;
        onPaste: (event: ClipboardEvent) => void;
        onClear: (item: FileItem) => void;
    }

    let { content, attachment, placeholder, sendHotKey, textareaClass, textareaStyle, onChange, onEnterPress, onPaste, onClear }: InputBoxInputProps = $props();

    const locale = useLocale('Chat');

    let textarea = $state<ReturnType<typeof TextArea>>();

    const { PREFIX_INPUT_BOX } = cssClasses;
    const AUTOSIZE = { minRows: 1, maxRows: 5 };

    export function focus() {
        textarea?.focus();
    }

    export function getTextarea() {
        return textarea?.getTextarea();
    }
</script>

<div class="{PREFIX_INPUT_BOX}-inputArea">
    <!-- the composer lays out its own toolbar: global TextArea defaults must not add a clear button, counter or line numbers -->
    <TextArea
        aria-label={locale().locale.input}
        autosize={AUTOSIZE}
        bind:this={textarea}
        class={[`${PREFIX_INPUT_BOX}-textarea`, textareaClass]}
        disabledEnterStartNewLine={sendHotKey === strings.SEND_HOT_KEY.ENTER}
        maxCount={0}
        {onChange}
        {onEnterPress}
        {placeholder}
        showClear={false}
        showCounter={false}
        showLineNumber={false}
        style={textareaStyle}
        value={content}
        onpaste={onPaste}
    />
    <Attachment {attachment} {onClear} />
</div>
