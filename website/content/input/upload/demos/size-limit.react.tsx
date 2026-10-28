import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, Toast } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';

    return (
        <>
            <Upload action={action} maxSize={1024} minSize={200} onSizeError={(file) => Toast.error(`${file.name} size invalid`)}>
                <Button icon={<IconUpload />} theme="light">
                    点击上传（最小 200KB，最大 1MB）
                </Button>
            </Upload>
        </>
    );
}
