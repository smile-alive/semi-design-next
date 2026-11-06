import { IconPlus, IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload, type UploadElement } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';

export default function UploadDemo() {
    let uploadRef: UploadElement | undefined;

    const manualUpload = () => {
        uploadRef?.upload();
    };

    return (
        <div>
            <Upload accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" action={action} uploadTrigger="custom" ref={(element) => (uploadRef = element)} onSuccess={(...v) => console.log(...v)} onError={(...v) => console.log(...v)}>
                <Button icon={<IconPlus />} theme="light" style={{ 'margin-inline-end': '8px' }}>
                    选择文件
                </Button>
            </Upload>
            <Button icon={<IconUpload />} theme="light" onClick={manualUpload}>
                开始上传
            </Button>
        </div>
    );
}
