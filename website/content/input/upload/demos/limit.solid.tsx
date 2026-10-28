import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-solid';

const limit = 1;

export default function UploadDemo() {
    const onChange = ({ fileList }: UploadOnChangeProps) => {
        console.log(fileList);
    };

    return (
        <Upload action="https://api.semi.design/upload" limit={limit} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
