import { IconUpload } from '@fibrae/semi-icons-solid';
import { type AfterUploadProps, Button, Upload } from '@fibrae/semi-ui-solid';

function afterUpload({ response }: AfterUploadProps) {
    if (response.status_code === 200) {
        return {
            autoRemove: false,
            status: 'uploadFail',
            validateMessage: '内容不合法',
            name: 'RenameByServer.jpg',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        };
    }
    return {};
}

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" afterUpload={afterUpload}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
