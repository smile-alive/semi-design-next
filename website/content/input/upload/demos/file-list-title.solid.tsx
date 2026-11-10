import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, Upload } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'document.pdf',
        status: 'success',
        size: '130KB',
    },
    {
        uid: '2',
        name: 'report.xlsx',
        status: 'success',
        size: '222KB',
    },
];

export default function UploadDemo() {
    return (
        <>
            <Upload action={action} customRequest={mockUpload} defaultFileList={defaultFileList} fileListTitle="已上传文件" style={{ 'margin-bottom': '20px' }}>
                <Button icon={<IconUpload />} theme="light">
                    自定义标题文字
                </Button>
            </Upload>
            <Upload action={action} customRequest={mockUpload} defaultFileList={defaultFileList} fileListTitle={<span style={{ color: 'var(--semi-color-primary)', 'font-weight': '600' }}>📁 重要文件</span>}>
                <Button icon={<IconUpload />} theme="light">
                    带样式的标题
                </Button>
            </Upload>
        </>
    );
}
