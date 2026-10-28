import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';
const imageOnly = 'image/*';
const videoOnly = 'video/*';
const fileLimit = '.pdf,.png,.jpeg';

export default function UploadDemo() {
    return (
        <>
            <Upload action={action} accept={imageOnly} style={{ 'margin-bottom': '12px' }}>
                <Button icon={<IconUpload />} theme="light">
                    上传图片
                </Button>
            </Upload>
            <Upload action={action} accept={videoOnly} style={{ 'margin-bottom': '12px' }}>
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
