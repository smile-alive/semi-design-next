<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<Upload action="/upload" customRequest={mockUpload} directory>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        上传文件夹
    </Button>
</Upload>
