import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, Image, type FileItem } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';
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
        <Upload action={action} customRequest={mockUpload} listType="picture" accept="image/*" multiple defaultFileList={defaultFileList} renderThumbnail={(file) => <Image src={file.url} alt={file.name} />}>
            <IconPlus aria-label="Upload picture" size="extra-large" />
        </Upload>
    );
}
