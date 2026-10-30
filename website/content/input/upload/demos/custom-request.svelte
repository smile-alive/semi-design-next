<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type UploadCustomRequestArgs } from '@fibrae/semi-ui-svelte';

    const mockRequest = ({ onProgress, onSuccess }: UploadCustomRequestArgs) => {
        let count = 0;
        const interval = setInterval(() => {
            if (count === 100) {
                clearInterval(interval);
                onSuccess({});
                return;
            }
            onProgress({ total: 100, loaded: count });
            count += 20;
        }, 500);
    };
</script>

<Upload action="https://api.semi.design/upload" customRequest={mockRequest}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
