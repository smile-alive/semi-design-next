import { IconDelete, IconDownload, IconEyeOpened, IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, type RenderFileItemProps, Upload } from '@fibrae/semi-ui-solid';

const defaultFileList: FileItem[] = [
    {
        uid: '1',
        name: 'dyBag.png',
        status: 'success',
        size: '130KB',
        preview: true,
        url: '/assets/root-web-sites/edit-bag.jpeg',
    },
];

const renderFileOperation = (fileItem: RenderFileItemProps) => (
    <div style={{ display: 'flex', 'column-gap': '8px', padding: '0 8px' }}>
        <Button aria-label="预览" icon={<IconEyeOpened />} type="tertiary" theme="borderless" size="small" />
        <Button aria-label="下载" icon={<IconDownload />} type="tertiary" theme="borderless" size="small" />
        <Button onClick={() => fileItem.onRemove?.()} aria-label="删除" icon={<IconDelete />} type="tertiary" theme="borderless" size="small" />
    </div>
);

export default function UploadDemo() {
    return (
        <Upload action="https://api.semi.design/upload" defaultFileList={defaultFileList} itemStyle={{ width: '300px' }} renderFileOperation={renderFileOperation}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
