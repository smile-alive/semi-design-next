<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type AfterUploadProps, type AfterUploadResult } from '@fibrae/semi-ui-svelte';

    const afterUpload = ({ response }: AfterUploadProps): AfterUploadResult => {
        if (response.status_code === 200) {
            return {
                autoRemove: false,
                status: 'uploadFail',
                validateMessage: '内容不合法',
                name: 'RenameByServer.jpg',
                url: '/assets/root-web-sites/edit-bag.jpeg',
            };
        }
        return {};
    };
</script>

<Upload action="https://api.semi.design/upload" {afterUpload}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
