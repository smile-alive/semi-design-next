<script setup lang="ts">
    import { computed, h, useTemplateRef, type ClassValue, type StyleValue } from 'vue';
    import { omit } from 'es-toolkit';
    import type { Attachment } from '@fibrae/semi-ai-foundation/components/ai-chat-input/interface';
    import Tooltip, { type TooltipProps } from '@fibrae/semi-ui-vue/tooltip/index';
    import Upload, { type UploadOnChangeProps } from '@fibrae/semi-ui-vue/upload/index';
    import type { AIChatInputSlots, AIChatInputUploadButtonSlotProps, AIChatInputUploadProps } from './interface';
    import UploadIcon from './upload-icon.vue';

    const props = defineProps<{
        uploadProps?: AIChatInputUploadProps;
        attachments: Attachment[];
        tipProps?: Omit<TooltipProps, 'content'>;
        hidden: boolean;
        buttonClass?: ClassValue;
        buttonStyle?: StyleValue;
    }>();

    const emit = defineEmits<{ change: [props: UploadOnChangeProps] }>();
    defineSlots<Pick<AIChatInputSlots, 'uploadButton' | 'uploadTip'>>();

    const upload = useTemplateRef('upload');

    const bindings = computed(() => ({
        ...omit(props.uploadProps ?? {}, ['onChange', 'onRemove']),
        action: props.uploadProps?.action ?? '',
    }));

    const disabled = computed(() => Boolean(props.uploadProps?.disabled));

    const openFileDialog = () => upload.value?.openFileDialog();

    const slotProps = (): AIChatInputUploadButtonSlotProps => ({
        defaultNode: h(UploadIcon, { disabled: disabled.value, class: props.buttonClass, style: props.buttonStyle }),
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
                <UploadIcon v-else :class="props.buttonClass" :disabled="disabled" :style="props.buttonStyle" />
            </Tooltip>
            <template v-else>
                <slot v-if="$slots.uploadButton" name="uploadButton" v-bind="slotProps()" />
                <UploadIcon v-else :class="props.buttonClass" :disabled="disabled" :style="props.buttonStyle" />
            </template>
        </template>
    </Upload>
</template>
