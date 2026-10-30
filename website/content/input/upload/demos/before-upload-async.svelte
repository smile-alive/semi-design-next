<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type BeforeUploadObjectResult, type BeforeUploadProps } from '@fibrae/semi-ui-svelte';

    let count = 0;

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        return new Promise<BeforeUploadObjectResult>((resolve, reject) => {
            if (count > 1) {
                count += 1;
                resolve({ autoRemove: false, shouldUpload: true });
            } else {
                const result: BeforeUploadObjectResult = {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: 'validateFail',
                    shouldUpload: false,
                    validateMessage: `第${count + 1}个注定失败`,
                };
                count += 1;
                reject(result);
            }
        });
    };
</script>

<Upload action="https://api.semi.design/upload" {beforeUpload}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传（上传前异步校验）
    </Button>
</Upload>
