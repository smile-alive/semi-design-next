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
            <Upload accept="image/gif, image/png, image/jpeg, image/bmp, image/webp" action={action} uploadTrigger="custom" ref={(element) => (uploadRef = element)} onSuccess={(response, file) => console.log(response, file)} onError={(error, file) => console.log(error, file)}>
                <Button icon={<IconPlus />} theme="light" style={{ 'margin-right': '8px' }}>
                    选择文件
                </Button>
            </Upload>
            <Button icon={<IconUpload />} theme="light" onClick={manualUpload}>
                开始上传
            </Button>
        </div>
    );
}
