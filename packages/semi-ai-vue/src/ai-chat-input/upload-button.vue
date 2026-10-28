<script setup lang="ts">
    import { computed, h, useTemplateRef } from 'vue';
    import { omit } from 'es-toolkit';
    import type { Attachment } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import Tooltip, { type TooltipProps } from '@fibrae/semi-ui-vue/tooltip/index';
    import Upload, { type UploadOnChangeProps } from '@fibrae/semi-ui-vue/upload/index';
    import type { AIChatInputSlots, AIChatInputUploadButtonSlotProps, AIChatInputUploadProps } from './interface';
    import UploadIcon from './upload-icon.vue';

    const props = defineProps<{
        uploadProps?: AIChatInputUploadProps;
        attachments: Attachment[];
        tipProps?: Omit<TooltipProps, 'content'>;
        hidden: boolean;
    }>();

    const emit = defineEmits<{ change: [props: UploadOnChangeProps] }>();
    defineSlots<Pick<AIChatInputSlots, 'uploadButton' | 'uploadTip'>>();

    const upload = useTemplateRef('upload');

    // AIChatInput owns the attachment list and calls onChange and onRemove itself
    const bindings = computed(() => ({
        ...omit(props.uploadProps ?? {}, ['onChange', 'onRemove']),
        action: props.uploadProps?.action ?? '',
    }));

    const disabled = computed(() => Boolean(props.uploadProps?.disabled));

    const openFileDialog = () => upload.value?.openFileDialog();

    const slotProps = (): AIChatInputUploadButtonSlotProps => ({
        defaultNode: h(UploadIcon, { disabled: disabled.value }),
        onOpenFileDialog: openFileDialog,
        disabled: disabled.value,
        attachments: props.attachments,
    });

    defineExpose({ insert: (files: File[]) => upload.value?.insert(files) });
</script>

<template>
    <!-- hidden: paste upload goes through this Upload, so it stays mounted without a trigger -->
    <Upload ref="upload" v-bind="bindings" :fileList="props.attachments" listType="none" :style="props.hidden ? { display: 'none' } : undefined" @change="emit('change', $event)">
        <template v-if="!props.hidden">
            <!-- the tooltip wraps the focus target, so aria-describedby lands on it and no Tab stop is added -->
            <Tooltip v-if="props.tipProps || $slots.uploadTip" v-bind="props.tipProps">
                <template #content>
                    <slot name="uploadTip" />
                </template>
                <slot v-if="$slots.uploadButton" name="uploadButton" v-bind="slotProps()" />
                <UploadIcon v-else :disabled="disabled" />
            </Tooltip>
            <template v-else>
                <slot v-if="$slots.uploadButton" name="uploadButton" v-bind="slotProps()" />
                <UploadIcon v-else :disabled="disabled" />
            </template>
        </template>
    </Upload>
</template>
