import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return (
        <Upload
            action="https://api.semi.design/upload"
            crop={{
                aspectRatio: 1,
                shape: 'round',
            }}
            beforeCrop={(file, fileList) => {
                console.log('beforeCrop:', file, fileList);
                // true continues cropping; false skips it and uploads directly
                return window.confirm('是否裁切图片？');
            }}
            onCropError={(error) => {
                console.error('裁切失败:', error);
            }}
            onSuccess={(response, file) => {
                console.log('上传成功:', response, file);
            }}
        >
            <Button icon={<IconUpload />} theme="light">
                点击上传（裁切前确认）
            </Button>
        </Upload>
    );
}
