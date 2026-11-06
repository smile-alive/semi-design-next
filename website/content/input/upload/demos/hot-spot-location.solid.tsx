import { createSignal } from 'solid-js';
import { IconPlus } from '@fibrae/semi-icons-solid';
import { type FileItem, Radio, RadioGroup, Upload, type UploadProps } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';
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
    const [hotSpotLocation, setLocation] = createSignal<UploadProps['hotSpotLocation']>('end');
    return (
        <>
            <RadioGroup aria-label="添加按钮位置" value={hotSpotLocation()} type="button" onChange={(event) => setLocation(event.target.value)}>
                <Radio value="start">start</Radio>
                <Radio value="end">end</Radio>
            </RadioGroup>
            <hr />
            <Upload action={action} listType="picture" showPicInfo accept="image/*" multiple hotSpotLocation={hotSpotLocation()} defaultFileList={defaultFileList} onPreviewClick={handlePreview}>
                <IconPlus aria-label="上传图片" size="extra-large" />
            </Upload>
        </>
    );
}
