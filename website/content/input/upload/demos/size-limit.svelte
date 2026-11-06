<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Toast, Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload action="https://api.semi.design/upload" maxSize={1024} minSize={200} onSizeError={(file) => Toast.error(`${file.name} size invalid`)}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（最小 200KB，最大 1MB）
    </Button>
</Upload>
