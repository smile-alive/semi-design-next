import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, type FileItem } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'music.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/placeholder/avatar-b.svg',
    },
    {
        uid: '2',
        name: 'brand.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/placeholder/avatar-b.svg',
    },
];

export default function UploadDemo() {
    return (
        <Upload action="/upload" customRequest={mockUpload} listType="picture" showPicInfo accept="image/*" multiple defaultFileList={defaultFileList}>
            <IconPlus aria-label="上传图片" size="extra-large" />
        </Upload>
    );
}
