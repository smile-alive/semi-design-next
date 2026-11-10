import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return (
        <Upload action="/upload" customRequest={mockUpload} multiple>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
