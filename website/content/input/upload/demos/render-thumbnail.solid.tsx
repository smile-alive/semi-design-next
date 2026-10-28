import { IconPlus } from '@fibrae/semi-icons-solid';
import { Image, type FileItem, Upload } from '@fibrae/semi-ui-solid';

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

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" listType="picture" accept="image/*" multiple defaultFileList={defaultFileList} renderThumbnail={(file) => <Image src={file.url} alt={file.name} />}>
            <IconPlus aria-label="Upload picture" size="extra-large" />
        </Upload>
    );
}
