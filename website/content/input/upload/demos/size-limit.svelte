<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Toast, Upload, type CustomFile } from '@fibrae/semi-ui-svelte';

    const onSizeError = (file: CustomFile) => Toast.error(`${file.name} size invalid`);
</script>

<Upload action="https://api.semi.design/upload" maxSize={1024} minSize={200} {onSizeError}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（最小 200KB，最大 1MB）
    </Button>
</Upload>
