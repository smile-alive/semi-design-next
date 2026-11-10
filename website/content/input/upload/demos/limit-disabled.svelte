<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Toast, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const limit = 2;
    // Only the trigger button is disabled; Upload itself stays enabled so files can still be removed.
    let disabled = $state(false);
    const onChange = (props: UploadOnChangeProps) => {
        disabled = props.fileList.length === limit;
    };
</script>

<Upload action="/upload" customRequest={mockUpload} {limit} {onChange} onExceed={() => Toast.warning(`最多只允许上传${limit}个文件`)}>
    <Button {disabled} theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（最多{limit}项）
    </Button>
</Upload>
