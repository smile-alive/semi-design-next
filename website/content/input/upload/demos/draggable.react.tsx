import { Upload } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return <Upload action="https://api.semi.design/upload" draggable dragMainText="点击上传文件或拖拽文件到这里" dragSubText="支持任意类型文件" />;
}
