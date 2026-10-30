<script lang="ts">
    import { IconPlus, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type UploadHandle } from '@fibrae/semi-ui-svelte';

    let upload = $state<UploadHandle>();
    const action = 'https://api.semi.design/upload';
</script>

<div>
    <Upload accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" {action} bind:this={upload} onError={(...v) => console.log(...v)} onSuccess={(...v) => console.log(...v)} uploadTrigger="custom">
        <Button style="margin-inline-end: 8px" theme="light">
            {#snippet icon()}<IconPlus />{/snippet}
            选择文件
        </Button>
    </Upload>
    <Button theme="light" onclick={() => upload?.upload()}>
        {#snippet icon()}<IconUpload />{/snippet}
        开始上传
    </Button>
</div>
