import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, Image, type FileItem } from '@fibrae/semi-ui-react';

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
    ];
    return (
        <>
            <Upload action={action} listType="picture" accept="image/*" multiple defaultFileList={defaultFileList} renderThumbnail={(file) => <Image src={file.url} alt={file.name} />}>
                <IconPlus aria-label="Upload picture" size="extra-large" />
            </Upload>
        </>
    );
}
