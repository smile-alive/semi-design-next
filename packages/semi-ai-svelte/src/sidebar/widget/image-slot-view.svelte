<script lang="ts">
    import { untrack } from 'svelte';
    import type { Editor } from '@tiptap/core';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { insertUploadedImage } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import type { CustomFile, FileItemStatus, UploadOnChangeProps } from '@fibrae/semi-ui-svelte/upload/interface';
    import Upload from '@fibrae/semi-ui-svelte/upload/upload.svelte';
    import type { ImageUploadNodeOptions } from './interface.js';

    interface ImageSlotViewProps {
        editor: Editor;
        /** The node type an uploaded image replaces the slot with, and the options the node was configured with */
        options: ImageUploadNodeOptions & { type: string };
        getPos: () => number | undefined;
        getNodeSize: () => number;
    }

    let { editor, options, getPos, getNodeSize }: ImageSlotViewProps = $props();

    const locale = useLocale('Sidebar');

    let status = $state<FileItemStatus>();

    const prefix = `${cssClasses.FILE}-image-slot`;

    // The options are fixed for the slot's life, like the node view they came from
    const { HTMLAttributes: _attributes, type, getUploadImageSrc, class: _class, onChange, onSuccess, ...uploadProps } = untrack(() => options);

    const mainText = $derived.by(() => {
        if (status === 'validateFail') {
            return locale().locale.validateFailInfo;
        }
        if (status === 'uploadFail') {
            return locale().locale.uploadFailInfo;
        }
        return locale().locale.uploadImgInfo;
    });

    const handleChange = (info: UploadOnChangeProps) => {
        const file = info.fileList[0];
        if (file) {
            status = file.status;
        }
        onChange?.(info);
    };

    const handleSuccess = (responseBody: unknown, file: CustomFile, fileList: Parameters<NonNullable<typeof onSuccess>>[2]) => {
        onSuccess?.(responseBody, file, fileList);
        insertUploadedImage({ editor, pos: getPos(), nodeSize: getNodeSize(), type, response: responseBody, name: file.name, getUploadImageSrc });
    };
</script>

<Upload {...uploadProps} action={uploadProps.action ?? ''} class={status && `${prefix}-${status}`} draggable onChange={handleChange} onSuccess={handleSuccess}>
    {#snippet dragMainText()}{mainText}{/snippet}
</Upload>
