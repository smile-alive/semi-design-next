import { useState } from 'react';
import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, RadioGroup, Radio, type FileItem, type UploadProps } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const action = '/upload';
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
    const [hotSpotLocation, setLocation] = useState<UploadProps['hotSpotLocation']>('end');
    return (
        <>
            <RadioGroup aria-label="添加按钮位置" value={hotSpotLocation} type="button" onChange={(e) => setLocation(e.target.value)}>
                <Radio value="start">start</Radio>
                <Radio value="end">end</Radio>
            </RadioGroup>
            <hr />
            <Upload action={action} customRequest={mockUpload} listType="picture" showPicInfo accept="image/*" multiple hotSpotLocation={hotSpotLocation} defaultFileList={defaultFileList} onPreviewClick={handlePreview}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
