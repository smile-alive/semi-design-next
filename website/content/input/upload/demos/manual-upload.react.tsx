import { useRef } from 'react';
import { IconUpload, IconPlus } from '@fibrae/semi-icons-react';
import { Upload, Button, type UploadHandle } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const uploadRef = useRef<UploadHandle>(null);
    const manulUpload = () => {
        uploadRef.current?.upload();
    };

    let action = 'https://api.semi.design/upload';
    return (
        <div>
            <Upload accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" action={action} uploadTrigger="custom" ref={uploadRef} onSuccess={(...v) => console.log(...v)} onError={(...v) => console.log(...v)}>
                <Button icon={<IconPlus />} theme="light" style={{ marginRight: 8 }}>
                    选择文件
                </Button>
            </Upload>
            <Button icon={<IconUpload />} theme="light" onClick={manulUpload}>
                开始上传
            </Button>
        </div>
    );
}
