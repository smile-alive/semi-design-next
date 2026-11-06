<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
    // A data function is evaluated per upload, so time is the upload moment
    const data = () => ({
        role: 'ies',
        time: new Date().getTime(),
    });
    const headers = {
        'x-tt-semi': 'semi-upload',
    };
</script>

<Upload {action} {data} {headers}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
