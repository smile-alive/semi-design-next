import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    let imageOnly = 'image/*';
    let videoOnly = 'video/*';
    let fileLimit = '.pdf,.png,.jpeg';
    return (
        <>
            <Upload action={action} accept={imageOnly} style={{ marginBottom: 12 }}>
                <Button icon={<IconUpload />} theme="light">
                    上传图片
                </Button>
            </Upload>
            <Upload action={action} accept={videoOnly} style={{ marginBottom: 12 }}>
                <Button icon={<IconUpload />} theme="light">
                    上传视频
                </Button>
            </Upload>
            <Upload action={action} accept={fileLimit}>
                <Button icon={<IconUpload />} theme="light">
                    上传 PDF, PNG, JPEG
                </Button>
            </Upload>
        </>
    );
}
