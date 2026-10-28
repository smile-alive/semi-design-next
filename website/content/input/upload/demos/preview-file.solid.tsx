import { IconFile, IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Image, type FileItem, Upload } from '@fibrae/semi-ui-solid';

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

export default function UploadDemo() {
    return (
        <Upload defaultFileList={defaultFileList} action="https://api.semi.design/upload" previewFile={(file) => (file.uid === '1' ? <IconFile size="large" /> : <Image src={file.url} alt="" />)}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
