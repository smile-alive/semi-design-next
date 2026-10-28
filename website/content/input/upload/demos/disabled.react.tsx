import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
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
    let action = 'https://api.semi.design/upload';
    return (
        <>
            <Upload action={action} disabled defaultFileList={defaultFileList}>
                <Button icon={<IconUpload />} theme="light" disabled>
                    点击上传
                </Button>
            </Upload>
        </>
    );
}
