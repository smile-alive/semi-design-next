import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, Upload } from '@fibrae/semi-ui-solid';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'first.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/placeholder/avatar-a.svg',
    },
    {
        uid: '2',
        name: 'second.png',
        status: 'validateFail',
        size: '222KB',
        preview: true,
        url: '/assets/placeholder/avatar-a.svg',
    },
];

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" disabled defaultFileList={defaultFileList}>
            <Button icon={<IconUpload />} theme="light" disabled>
                点击上传
            </Button>
        </Upload>
    );
}
