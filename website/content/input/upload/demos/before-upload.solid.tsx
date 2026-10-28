import { IconUpload } from '@fibrae/semi-icons-solid';
import { type BeforeUploadObjectResult, type BeforeUploadProps, Button, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    let count = 0;

    const transformFile = (fileInstance: File) => {
        if (count === 0) {
            return new File([fileInstance], 'newFileName', { type: 'image/png' });
        }
        return fileInstance;
    };

    const beforeUpload = ({ file }: BeforeUploadProps) => {
        const result: BeforeUploadObjectResult = count > 0 ? { autoRemove: false, fileInstance: file.fileInstance, shouldUpload: true } : { autoRemove: false, fileInstance: file.fileInstance, status: 'validateFail', shouldUpload: false };
        count = count + 1;
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
