<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const limit = 1;
    const onChange = (props: UploadOnChangeProps) => {
        console.log(props.fileList);
    };
</script>

<Upload action="/upload" customRequest={mockUpload} {limit} {onChange}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（最多{limit}项）
    </Button>
</Upload>
