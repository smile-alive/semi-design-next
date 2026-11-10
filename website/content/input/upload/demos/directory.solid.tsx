import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload action="/upload" customRequest={mockUpload} directory>
            <Button icon={<IconUpload />} theme="light">
                上传文件夹
            </Button>
        </Upload>
    );
}
