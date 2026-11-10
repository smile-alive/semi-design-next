<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<Upload action="/upload" crop customRequest={mockUpload} onSuccess={(response, file) => console.log('上传成功:', response, file)}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（启用裁切）
    </Button>
</Upload>
