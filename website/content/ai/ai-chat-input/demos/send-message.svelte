<script lang="ts">
    import { AIChatInput, type AIChatInputContent as Content, type AIChatInputReference as Reference, type AIChatInputUploadProps } from '@fibrae/semi-ai-svelte';
    import type { UploadOnChangeProps as OnChangeProps } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps: AIChatInputUploadProps = {
        action: '/upload',
        customRequest: mockUpload,
        defaultFileList: [
            {
                uid: '1',
                name: 'dy.jpeg',
                status: 'success',
                size: '130kb',
                url: '/assets/placeholder/avatar-a.svg',
            },
            {
                uid: '5',
                name: 'resso.jpeg',
                status: 'uploading',
                percent: 50,
                size: '222kb',
                url: '/assets/placeholder/avatar-b.svg',
            },
        ],
    };

    const reference: Reference[] = [
        {
            id: '1',
            type: 'text',
            content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
        },
    ];

    let references = $state(reference);
    let generating = $state(false);

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const onUploadChange = (fileList: OnChangeProps) => {
        console.log('onUploadChange', fileList);
    };

    const toggleGenerate = () => {
        generating = !generating;
    };

    const onMessageSend = () => {
        toggleGenerate();
        references = [];
    };

    const handleReferenceDelete = (item: Reference) => {
        references = references.filter((ref) => ref.id !== item.id);
    };
</script>

<AIChatInput defaultContent="点击发送按钮，观察上传内容、引用内容、输入框内容变化" {generating} {onContentChange} {onMessageSend} onReferenceDelete={handleReferenceDelete} onStopGenerate={toggleGenerate} {onUploadChange} {references} style="margin: 12px" {uploadProps} />
