<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<Upload
    action="/upload"
    crop={{
        aspectRatio: 1,
        shape: 'rect',
    }}
    customRequest={mockUpload}
    draggable
    onDrop={(_e, files) => console.log('拖拽文件:', files)}
    onSuccess={(response, file) => console.log('上传成功:', response, file)}
>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        拖拽上传（启用裁切）
    </Button>
</Upload>
