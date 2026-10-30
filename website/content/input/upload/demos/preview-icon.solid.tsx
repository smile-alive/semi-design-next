import { IconEyeOpened, IconPlus } from '@fibrae/semi-icons-solid';
import { type FileItem, Upload } from '@fibrae/semi-ui-solid';

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

function handlePreview(file: FileItem) {
    window.open(file.url, 'imagePreview', 'width=300,height=300');
}

export default function UploadDemo() {
    return (
        <>
            <Upload action="https://api.semi.design/upload" listType="picture" showPicInfo accept="image/*" multiple defaultFileList={defaultFileList} onPreviewClick={handlePreview} renderPicPreviewIcon={() => <IconEyeOpened style={{ color: 'var(--semi-color-white)', 'font-size': '24px' }} />}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
