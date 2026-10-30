<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
    const imageOnly = 'image/*';
    const videoOnly = 'video/*';
    const fileLimit = '.pdf,.png,.jpeg';
</script>

<Upload accept={imageOnly} {action} style="margin-bottom: 12px">
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        上传图片
    </Button>
</Upload>
<Upload accept={videoOnly} {action} style="margin-bottom: 12px">
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        上传视频
    </Button>
</Upload>
<Upload accept={fileLimit} {action}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        上传 PDF, PNG, JPEG
    </Button>
</Upload>
