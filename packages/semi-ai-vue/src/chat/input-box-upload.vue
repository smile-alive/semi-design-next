<script setup lang="ts">
    import { Text, computed, useTemplateRef } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import slotNodes from '@fibrae/semi-ui-vue/_base/slot-nodes';
    import Tooltip from '@fibrae/semi-ui-vue/tooltip/index';
    import { canCarryPopupState } from '@fibrae/semi-ui-vue/tooltip/trigger';
    import Upload, { type FileItem, type UploadOnChangeProps } from '@fibrae/semi-ui-vue/upload/index';
    import type { ChatProps, ChatSlots } from './interface';
    import UploadButton from './upload-button.vue';

    // Dropped and pasted files go through this Upload too, so it stays mounted, hidden, when only the click trigger is off.
    const props = defineProps<{
        attachment: FileItem[];
        clickUpload: boolean;
        uploadProps?: ChatProps['uploadProps'];
        uploadTipProps?: ChatProps['uploadTipProps'];
    }>();

    const emit = defineEmits<{ change: [props: UploadOnChangeProps] }>();
    const slots = defineSlots<Pick<ChatSlots, 'uploadButton' | 'uploadTip'>>();

    const upload = useTemplateRef('upload');
    const nativeControls = new Set(['input', 'select', 'textarea']);

    const { PREFIX_INPUT_BOX } = cssClasses;

    // class and style are set by trigger state; onChange is called by the foundation, binding it doubles it
    const bindings = computed(() => ({
        ...omit(props.uploadProps ?? {}, ['class', 'style', 'onChange']),
        action: props.uploadProps?.action ?? '',
    }));

    // a function, not a computed: slots are not reactive
    const tipShown = () => props.clickUpload && Boolean(slots.uploadTip || props.uploadTipProps);

    // Tooltip makes its trigger a Tab stop, so a text or plain-element trigger is kept out of the Tab order and Upload's
    // add area stays the only keyboard entry. Known limit: a component VNode goes to Tooltip as is, so one that renders
    // no control adds a Tab stop.
    const triggerIsControl = () => {
        const nodes = slotNodes(slots.uploadButton?.() ?? []);
        if (nodes.length !== 1) return false;
        const [node] = nodes[0];
        if (node.type === Text) return false;
        if (typeof node.type !== 'string') return true;
        const attrs = node.props ?? {};
        return canCarryPopupState(node) || nativeControls.has(node.type) || attrs.tabindex != null || attrs.tabIndex != null || (attrs.contenteditable != null && attrs.contenteditable !== 'false');
    };

    const disabled = () => Boolean(props.uploadProps?.disabled);

    defineExpose({ insert: (files: File[]) => upload.value?.insert(files) });
</script>

<template>
    <Upload ref="upload" v-bind="bindings" :class="props.clickUpload ? [`${PREFIX_INPUT_BOX}-upload`, props.uploadProps?.class] : undefined" :fileList="props.attachment" :style="props.clickUpload ? props.uploadProps?.style : { display: 'none' }" @change="emit('change', $event)">
        <Tooltip v-if="tipShown()" v-bind="props.uploadTipProps">
            <template v-if="$slots.uploadTip" #content>
                <slot name="uploadTip" />
            </template>
            <template v-if="$slots.uploadButton">
                <slot v-if="triggerIsControl()" name="uploadButton" />
                <span v-else tabindex="-1">
                    <slot name="uploadButton" />
                </span>
            </template>
            <UploadButton v-else :disabled="disabled()" />
        </Tooltip>
        <template v-else-if="props.clickUpload">
            <slot v-if="$slots.uploadButton" name="uploadButton" />
            <UploadButton v-else :disabled="disabled()" />
        </template>
    </Upload>
</template>
