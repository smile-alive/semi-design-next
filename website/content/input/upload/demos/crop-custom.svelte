<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type UploadCropProps } from '@fibrae/semi-ui-svelte';

    const crop: UploadCropProps = {
        aspectRatio: 16 / 9,
        shape: 'rect',
        quality: 0.8,
        modalTitle: '裁切图片',
        modalOkText: '确认裁切',
        modalCancelText: '取消',
    };
</script>

<Upload action="https://api.semi.design/upload" {crop} onSuccess={(response, file) => console.log('上传成功:', response, file)}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（16:9 裁切）
    </Button>
</Upload>
