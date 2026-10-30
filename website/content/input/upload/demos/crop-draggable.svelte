<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';

    const crop = {
        aspectRatio: 1,
        shape: 'rect',
    } as const;
</script>

<Upload action="https://api.semi.design/upload" {crop} draggable onDrop={(_e, files) => console.log('拖拽文件:', files)} onSuccess={(response, file) => console.log('上传成功:', response, file)}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        拖拽上传（启用裁切）
    </Button>
</Upload>
