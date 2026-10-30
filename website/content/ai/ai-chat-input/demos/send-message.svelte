<script lang="ts">
    import { AIChatInput, type AIChatInputContent as Content, type AIChatInputReference as Reference, type AIChatInputUploadProps } from '@fibrae/semi-ai-svelte';
    import type { UploadOnChangeProps } from '@fibrae/semi-ui-svelte';

    const uploadProps: AIChatInputUploadProps = {
        action: 'https://api.semi.design/upload',
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

    let references = $state<Reference[]>([
        {
            id: '1',
            type: 'text',
            content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
        },
    ]);
    let generating = $state(false);

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const onUploadChange = (fileList: UploadOnChangeProps) => {
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
