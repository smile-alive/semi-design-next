import { useRef } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type BeforeUploadProps, type BeforeUploadObjectResult } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const countRef = useRef(0);

    const transformFile = (fileInstance: File) => {
        if (countRef.current === 0) {
            return new File([fileInstance], 'newFileName', { type: 'image/png' });
        }
        return fileInstance;
    };

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        let result: BeforeUploadObjectResult;
        if (countRef.current > 0) {
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
        countRef.current = countRef.current + 1;
        return result;
    };

    return (
        <Upload action="https://api.semi.design/upload" transformFile={transformFile} beforeUpload={beforeUpload}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（上传前同步校验）
            </Button>
        </Upload>
    );
}
