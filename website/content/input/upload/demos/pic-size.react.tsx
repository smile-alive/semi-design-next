import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, Image, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'image-1.jpg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/abstract.jpg',
        },
    ];
    return (
        <>
            <Upload action={action} listType="picture" accept="image/*" multiple defaultFileList={defaultFileList} picHeight={110} picWidth={200} renderThumbnail={(file) => <Image src={file.url} alt={file.name} width={200} height={110} />}>
                <IconPlus aria-label="上传图片" size="extra-large" style={{ margin: 4 }} />
                点击添加图片
            </Upload>
        </>
    );
}
