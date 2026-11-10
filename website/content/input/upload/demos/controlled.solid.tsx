import { createSignal } from 'solid-js';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-solid';
import { mockUpload } from '#/lib/mock-upload';

const initList: FileItem[] = [
    {
        uid: '1',
        name: 'dyBag.jpeg',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/root-web-sites/edit-bag.jpeg',
    },
    {
        uid: '2',
        name: 'dy.jpeg',
        status: 'uploading',
        size: '222KB',
        percent: 50,
        preview: true,
        fileInstance: new File([new ArrayBuffer(2048)], 'dy.jpeg', { type: 'image/jpeg' }),
        url: '/assets/placeholder/avatar-a.svg',
    },
];

export default function UploadDemo() {
    const [list, updateList] = createSignal(initList);

    const onChange = ({ fileList, currentFile }: UploadOnChangeProps) => {
        console.log('onChange');
        console.log(fileList);
        console.log(currentFile);
        const newFileList = [...fileList]; // 展开得到新数组
        updateList(newFileList);
    };

    return (
        <Upload action="/upload" customRequest={mockUpload} onChange={onChange} fileList={list()} showRetry={false}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
