import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.jpeg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dyBag2.jpeg',
            status: 'uploadFail',
            size: '222KB',
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'dyBag2.jpeg', { type: 'image/png' }),
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];

    return (
        <>
            <Upload action={action} defaultFileList={defaultFileList}>
                <Button icon={<IconUpload />} theme="light">
                    点击上传
                </Button>
            </Upload>
        </>
    );
}
