import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" directory>
            <Button icon={<IconUpload />} theme="light">
                上传文件夹
            </Button>
        </Upload>
    );
}
