import { useState } from 'react';
import { IconPlus } from '@fibrae/semi-icons-react';
import { Upload, RadioGroup, Radio, type FileItem, type UploadProps } from '@fibrae/semi-ui-react';

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
    const [hotSpotLocation, setLocation] = useState<UploadProps['hotSpotLocation']>('end');
    return (
        <>
            <RadioGroup value={hotSpotLocation} type="button" onChange={(e) => setLocation(e.target.value)}>
                <Radio value="start">start</Radio>
                <Radio value="end">end</Radio>
            </RadioGroup>
            <hr />
            <Upload action={action} listType="picture" showPicInfo accept="image/*" multiple hotSpotLocation={hotSpotLocation} defaultFileList={defaultFileList} onPreviewClick={handlePreview}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
