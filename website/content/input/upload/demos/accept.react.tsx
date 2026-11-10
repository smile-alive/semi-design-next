import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';
const imageOnly = 'image/*';
const videoOnly = 'video/*';
const fileLimit = '.pdf,.png,.jpeg';

export default function UploadDemo() {
    return (
        <>
            <Upload action={action} customRequest={mockUpload} accept={imageOnly} style={{ marginBottom: 12 }}>
                <Button icon={<IconUpload />} theme="light">
                    上传图片
                </Button>
            </Upload>
            <Upload action={action} customRequest={mockUpload} accept={videoOnly} style={{ marginBottom: 12 }}>
                <Button icon={<IconUpload />} theme="light">
                    上传视频
                </Button>
            </Upload>
            <Upload action={action} customRequest={mockUpload} accept={fileLimit}>
                <Button icon={<IconUpload />} theme="light">
                    上传 PDF, PNG, JPEG
                </Button>
            </Upload>
        </>
    );
}
