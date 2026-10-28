import { IconPlus, IconEyeOpened } from '@fibrae/semi-icons-react';
import { Upload, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
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
        const feature = 'width=300,height=300';
        window.open(file.url, 'imagePreview', feature);
    };
    return (
        <>
            <Upload action={action} listType="picture" showPicInfo accept="image/*" multiple defaultFileList={defaultFileList} onPreviewClick={handlePreview} renderPicPreviewIcon={() => <IconEyeOpened style={{ color: 'var(--semi-color-white)', fontSize: 24 }} />}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
