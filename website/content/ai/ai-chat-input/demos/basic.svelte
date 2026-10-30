<script lang="ts">
    import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-svelte';
    import type { UploadOnChangeProps as OnChangeProps } from '@fibrae/semi-ui-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };

    const onContentChange = (content: Content[]) => {
        console.log('onContentChange', content);
    };

    const onUploadChange = (fileList: OnChangeProps) => {
        console.log('onUploadChange', fileList);
    };
</script>

<AIChatInput {onContentChange} {onUploadChange} placeholder="输入内容或者上传内容..." style="margin: 12px" {uploadProps} />
