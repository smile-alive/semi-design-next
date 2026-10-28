import { IconUpload, IconFile } from '@fibrae/semi-icons-react';
import { Upload, Button, Image, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dyBag2.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
    return (
        <Upload defaultFileList={defaultFileList} action={action} previewFile={(file) => (file.uid === '1' ? <IconFile size="large" /> : <Image src={file.url} alt="" />)}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
