import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    return (
        <>
            <Upload action={action} directory>
                <Button icon={<IconUpload />} theme="light">
                    上传文件夹
                </Button>
            </Upload>
        </>
    );
}
