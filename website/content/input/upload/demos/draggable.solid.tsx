import { Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return <Upload action="/upload" customRequest={mockUpload} draggable dragMainText="点击上传文件或拖拽文件到这里" dragSubText="支持任意类型文件" />;
}
