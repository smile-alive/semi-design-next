import { IconUpload } from '@fibrae/semi-icons-solid';
import { type BeforeUploadObjectResult, type BeforeUploadProps, Button, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    let count = 0;

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        return new Promise<BeforeUploadObjectResult>((resolve, reject) => {
            if (count > 1) {
                const result = {
                    autoRemove: false,
                    shouldUpload: true,
                };
                count = count + 1;
                resolve(result);
            } else {
                const result = {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: 'validateFail',
                    shouldUpload: false,
                    validateMessage: `第${count + 1}个注定失败`,
                };
                count = count + 1;
                reject(result);
            }
        });
    };

    return (
        <Upload action="https://api.semi.design/upload" beforeUpload={beforeUpload}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（上传前异步校验）
            </Button>
        </Upload>
    );
}
