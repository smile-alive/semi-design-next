import { useRef } from 'react';
import { IconUpload, IconPlus } from '@fibrae/semi-icons-react';
import { Upload, Button, type UploadHandle } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';

export default function UploadDemo() {
    const uploadRef = useRef<UploadHandle>(null);
    const manualUpload = () => {
        uploadRef.current?.upload();
    };

    return (
        <div>
            <Upload accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" action={action} customRequest={mockUpload} uploadTrigger="custom" ref={uploadRef} onSuccess={(...v) => console.log(...v)} onError={(...v) => console.log(...v)}>
                <Button icon={<IconPlus />} theme="light" style={{ marginInlineEnd: 8 }}>
                    选择文件
                </Button>
            </Upload>
            <Button icon={<IconUpload />} theme="light" onClick={manualUpload}>
                开始上传
            </Button>
        </div>
    );
}
