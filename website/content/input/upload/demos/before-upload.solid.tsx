import { IconUpload } from '@fibrae/semi-icons-solid';
import { type BeforeUploadObjectResult, type BeforeUploadProps, Button, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
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
        count = count + 1;
        return result;
    };

    return (
        <Upload action="/upload" customRequest={mockUpload} transformFile={transformFile} beforeUpload={beforeUpload}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（上传前同步校验）
            </Button>
        </Upload>
    );
}
