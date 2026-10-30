<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type BeforeUploadObjectResult, type BeforeUploadProps } from '@fibrae/semi-ui-svelte';

    let count = 0;

    const transformFile = (fileInstance: File) => {
        if (count === 0) {
            return new File([fileInstance], 'newFileName', { type: 'image/png' });
        }
        return fileInstance;
    };

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        let result: BeforeUploadObjectResult;
        if (count > 0) {
            result = {
                autoRemove: false,
                fileInstance: file.fileInstance,
                shouldUpload: true,
            };
        } else {
            result = {
                autoRemove: false,
                fileInstance: file.fileInstance,
                status: 'validateFail',
                shouldUpload: false,
            };
        }
        count += 1;
        return result;
    };
</script>

<Upload action="https://api.semi.design/upload" {beforeUpload} {transformFile}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（上传前同步校验）
    </Button>
</Upload>
