import { IconBolt } from '@fibrae/semi-icons-react';
import { Upload } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    return <Upload action="https://api.semi.design/upload" dragIcon={<IconBolt />} draggable accept="application/pdf,.jpeg" dragMainText="点击上传文件或拖拽文件到这里" dragSubText="仅支持jpeg、pdf" style={{ marginTop: 10 }} />;
}
