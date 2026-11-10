<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<Upload
    action="/upload"
    crop={{
        aspectRatio: 1,
        shape: 'round',
        quality: 0.9,
        modalTitle: '裁切头像',
    }}
    customRequest={mockUpload}
    onSuccess={(response, file) => console.log('上传成功:', response, file)}
>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（圆形裁切）
    </Button>
</Upload>
