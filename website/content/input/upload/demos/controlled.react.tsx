import { useState } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem, type UploadOnChangeProps } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
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

    const [list, updateList] = useState(initList);

    const onChange = ({ fileList, currentFile }: UploadOnChangeProps) => {
        console.log('onChange');
        console.log(fileList);
        console.log(currentFile);
        let newFileList = [...fileList]; // 展开得到新数组
        updateList(newFileList);
    };

    return (
        <Upload action="https://api.semi.design/upload" onChange={onChange} fileList={list} showRetry={false}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
