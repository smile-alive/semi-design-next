<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload
    action="https://api.semi.design/upload"
    beforeCrop={(file, fileList) => {
        console.log('beforeCrop:', file, fileList);
        // true continues cropping; false skips it and uploads directly
        return window.confirm('是否裁切图片？');
    }}
    crop={{ aspectRatio: 1, shape: 'round' }}
    onCropError={(error) => console.error('裁切失败:', error)}
    onSuccess={(response, file) => console.log('上传成功:', response, file)}
>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（裁切前确认）
    </Button>
</Upload>
