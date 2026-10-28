import { IconPlus } from '@fibrae/semi-icons-solid';
import { type FileItem, Toast, Upload } from '@fibrae/semi-ui-solid';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'dyBag.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/root-web-sites/edit-bag.jpeg',
    },
    {
        uid: '2',
        name: 'dyBag2.jpeg',
        status: 'success',
        size: '222KB',
        preview: true,
        fileInstance: new File([new ArrayBuffer(2048)], 'dyBag2.jpeg', { type: 'image/png' }),
        url: '/assets/root-web-sites/edit-bag.jpeg',
    },
];

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" limit={2} listType="picture" accept="image/*" defaultFileList={defaultFileList} onExceed={() => Toast.warning('最多只允许上传2个文件')}>
            <IconPlus aria-label="上传图片" size="extra-large" />
        </Upload>
    );
}
