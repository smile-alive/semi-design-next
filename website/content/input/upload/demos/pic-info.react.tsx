import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
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
    return (
        <>
            <Upload action={action} listType="picture" showPicInfo accept="image/*" multiple defaultFileList={defaultFileList}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
