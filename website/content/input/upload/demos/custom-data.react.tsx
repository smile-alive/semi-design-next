import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

const action = 'https://api.semi.design/upload';
// A data function is evaluated per upload, so time is the upload moment
const data = () => ({
    role: 'ies',
    time: new Date().getTime(),
});
const headers = {
    'x-tt-semi': 'semi-upload',
};

export default function UploadDemo() {
    return (
        <Upload action={action} data={data} headers={headers}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
