import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'dyBag.jpeg',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/root-web-sites/edit-bag.jpeg',
    },
];

export default function UploadDemo() {
    return (
        <Upload action={action} customRequest={mockUpload} defaultFileList={defaultFileList} showReplace>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
