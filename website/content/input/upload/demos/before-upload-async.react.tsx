import { useRef } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type BeforeUploadProps, type BeforeUploadObjectResult } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const countRef = useRef(0);
    const beforeUpload = ({ file }: BeforeUploadProps) => {
        return new Promise<BeforeUploadObjectResult>((resolve, reject) => {
            if (countRef.current > 1) {
                const result = {
                    autoRemove: false,
                    shouldUpload: true,
                };
                countRef.current = countRef.current + 1;
                resolve(result);
            } else {
                const result = {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: 'validateFail',
                    shouldUpload: false,
                    validateMessage: `第${countRef.current + 1}个注定失败`,
                };
                countRef.current = countRef.current + 1;
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
