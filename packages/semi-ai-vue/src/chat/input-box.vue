<script setup lang="ts">
    import { computed, h, type StyleValue, useTemplateRef } from 'vue';
    import InputBoxFoundation, { type InputBoxAdapter } from '@fibrae/semi-ai-foundation/chat/inputbox-foundation';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import type { FileItem } from '@fibrae/semi-ui-vue/upload/index';
    import ClearButton from './clear-button.vue';
    import InputBoxInput from './input-box-input.vue';
    import InputBoxLayout from './input-box-layout.vue';
    import InputBoxUpload from './input-box-upload.vue';
    import type { ChatInputAreaSlotProps, ChatInputChangeProps, ChatProps, ChatSlots, SendHotKey } from './interface';
    import SendButton from './send-button.vue';

    interface InputBoxProps {
        placeholder?: string;
        showClearContext: boolean;
        sendHotKey: SendHotKey;
        /** Overrides the built-in send state when given */
        canSend?: boolean;
        disableSend: boolean;
        clickUpload: boolean;
        dragUpload: boolean;
        pasteUpload: boolean;
        uploadProps?: ChatProps['uploadProps'];
        uploadTipProps?: ChatProps['uploadTipProps'];
        inputBoxCls?: string;
        inputBoxStyle?: StyleValue;
    }

    interface InputBoxState {
        content: string;
        attachment: FileItem[];
    }

    type Foundation = InputBoxFoundation<InputBoxProps, InputBoxState>;
    type Adapter = InputBoxAdapter<InputBoxProps, InputBoxState>;

    const props = withDefaults(defineProps<InputBoxProps>(), { canSend: undefined });

    const emit = defineEmits<{
        send: [content: string, attachment?: FileItem[]];
        clear: [];
        inputChange: [props: ChatInputChangeProps];
    }>();

    const slots = defineSlots<Pick<ChatSlots, 'inputArea' | 'uploadButton' | 'uploadTip'>>();

    // String refs in h() bind to this component even when the #inputArea slot places the node; when the slot drops one of
    // two placements, a function ref would be reset to null, while a string ref keeps the remaining instance.
    const input = useTemplateRef('input');
    const upload = useTemplateRef('upload');

    const { foundation, state } = useFoundation<Foundation, Adapter, InputBoxProps, InputBoxState>(
        InputBoxFoundation,
        props,
        () => ({ content: '', attachment: [] }),
        (base) => ({
            notifyInputChange: (value) => emit('inputChange', value),
            setInputValue: (content) => base.setState({ content }),
            setAttachment: (attachment) => base.setState({ attachment }),
            notifySend: (content, attachment) => emit('send', content, attachment),
            notifyUploadChange: (change) => props.uploadProps?.onChange?.(change),
            manualUpload: (files) => upload.value?.insert(files),
        })
    );

    const uploadMounted = computed(() => props.clickUpload || props.dragUpload || props.pasteUpload);
    const sendDisabled = computed(() => InputBoxFoundation.getDisableSend(state.value.content, state.value.attachment, props.disableSend, props.canSend));

    const focusInput = () => input.value?.focus();

    const clear = () => emit('clear');

    // each call builds new nodes: the slot may render a part inside defaultNode and on its own
    const clearNode = () => h(ClearButton, { onClick: clear });

    const uploadNode = () =>
        h(
            InputBoxUpload,
            {
                ref: 'upload',
                attachment: state.value.attachment,
                clickUpload: props.clickUpload,
                uploadProps: props.uploadProps,
                uploadTipProps: props.uploadTipProps,
                onChange: foundation.onAttachmentAdd,
            },
            slots
        );

    const inputNode = () =>
        h(InputBoxInput, {
            ref: 'input',
            content: state.value.content,
            attachment: state.value.attachment,
            placeholder: props.placeholder,
            sendHotKey: props.sendHotKey,
            onChange: foundation.onInputAreaChange,
            onEnterPress: foundation.onEnterPress,
            onPaste: foundation.onPaste,
            onClear: foundation.onAttachmentDelete,
        });

    const sendNode = () => h(SendButton, { disabled: sendDisabled.value, onClick: foundation.onSend });

    const slotProps = (): ChatInputAreaSlotProps => ({
        defaultNode: h(
            InputBoxLayout,
            { class: props.inputBoxCls, style: props.inputBoxStyle, onInnerClick: focusInput },
            {
                clear: props.showClearContext ? clearNode : undefined,
                upload: uploadMounted.value ? uploadNode : undefined,
                input: inputNode,
                send: sendNode,
            }
        ),
        clearContextNode: clearNode(),
        uploadNode: uploadMounted.value ? uploadNode() : null,
        inputNode: inputNode(),
        sendNode: sendNode(),
        onSend: (content = '', attachment) => emit('send', content, attachment),
        onClear: clear,
        onClick: focusInput,
    });

    defineExpose({ focusInput, insertFiles: (files: File[]) => upload.value?.insert(files) });
</script>

<template>
    <slot v-if="$slots.inputArea" name="inputArea" v-bind="slotProps()" />
    <InputBoxLayout v-else :class="props.inputBoxCls" :style="props.inputBoxStyle" @innerClick="focusInput">
        <template v-if="props.showClearContext" #clear>
            <ClearButton @click="clear" />
        </template>
        <template v-if="uploadMounted" #upload>
            <InputBoxUpload ref="upload" :attachment="state.attachment" :clickUpload="props.clickUpload" :uploadProps="props.uploadProps" :uploadTipProps="props.uploadTipProps" @change="foundation.onAttachmentAdd">
                <template v-if="$slots.uploadButton" #uploadButton>
                    <slot name="uploadButton" />
                </template>
                <template v-if="$slots.uploadTip" #uploadTip>
                    <slot name="uploadTip" />
                </template>
            </InputBoxUpload>
        </template>
        <template #input>
            <InputBoxInput ref="input" :attachment="state.attachment" :content="state.content" :placeholder="props.placeholder" :sendHotKey="props.sendHotKey" @change="foundation.onInputAreaChange" @clear="foundation.onAttachmentDelete" @enterPress="foundation.onEnterPress" @paste="foundation.onPaste" />
        </template>
        <template #send>
            <SendButton :disabled="sendDisabled" @click="foundation.onSend" />
        </template>
    </InputBoxLayout>
</template>
