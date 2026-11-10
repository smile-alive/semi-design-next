import { IconBolt } from '@fibrae/semi-icons-solid';
import { Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

export default function UploadDemo() {
    return <Upload action="/upload" customRequest={mockUpload} dragIcon={<IconBolt />} draggable accept="application/pdf,.jpeg" dragMainText="点击上传文件或拖拽文件到这里" dragSubText="仅支持jpeg、pdf" style={{ 'margin-top': '10px' }} />;
}
