import { IconPlus } from '@fibrae/semi-icons-solid';
import { type FileItem, Upload } from '@fibrae/semi-ui-solid';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'dy.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/placeholder/avatar-a.svg',
    },
];

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" listType="picture" accept="image/*" multiple defaultFileList={defaultFileList}>
            <IconPlus aria-label="上传图片" size="extra-large" />
        </Upload>
    );
}
