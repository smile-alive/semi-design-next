import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    // A data function is evaluated per upload, so time is the upload moment
    let data = () => ({
        role: 'ies',
        time: new Date().getTime(),
    });
    let headers = {
        'x-tt-semi': 'semi-upload',
    };
    return (
        <Upload action={action} data={data} headers={headers}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
