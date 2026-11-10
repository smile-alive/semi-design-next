import { IconPlus, IconEyeOpened } from '@fibrae/semi-icons-react';
import { Upload, type FileItem } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'resso.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/placeholder/avatar-b.svg',
    },
];
const handlePreview = (file: FileItem) => {
    window.open(file.url, 'imagePreview', 'width=300,height=300');
};

export default function UploadDemo() {
    return (
        <>
            <Upload action="/upload" customRequest={mockUpload} listType="picture" showPicInfo accept="image/*" multiple defaultFileList={defaultFileList} onPreviewClick={handlePreview} renderPicPreviewIcon={() => <IconEyeOpened style={{ color: 'var(--semi-color-white)', fontSize: 24 }} />}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
