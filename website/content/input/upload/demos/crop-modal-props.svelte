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
    cropModalProps={{
        width: 800,
        style: 'height: 600px',
        bodyStyle: 'height: 500px; background-color: #f5f5f5',
    }}
    customRequest={mockUpload}
    onSuccess={(response, file) => console.log('上传成功:', response, file)}
>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        自定义弹窗样式
    </Button>
</Upload>
