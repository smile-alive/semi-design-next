import { createSignal } from 'solid-js';
import { IconDelete, IconDownload, IconExpand, IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, ImagePreview, type RenderFileItemProps, Upload } from '@fibrae/semi-ui-solid';

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

export default function UploadDemo() {
    const [visible, setVisible] = createSignal(false);

    const renderFileOperation = (fileItem: RenderFileItemProps) => (
        <div style={{ display: 'flex', 'column-gap': '8px', padding: '0 8px' }}>
            <Button aria-label="预览" icon={<IconExpand />} type="tertiary" theme="borderless" size="small" onClick={() => setVisible(true)} />
            <Button aria-label="下载" icon={<IconDownload />} type="tertiary" theme="borderless" size="small" />
            <Button aria-label="删除" onClick={() => fileItem.onRemove?.()} icon={<IconDelete />} type="tertiary" theme="borderless" size="small" />
            <ImagePreview src={fileItem.url} visible={visible()} onVisibleChange={(value) => setVisible(value)} />
        </div>
    );

    return (
        <Upload action="https://api.semi.design/upload" defaultFileList={defaultFileList} itemStyle={{ width: '300px' }} renderFileOperation={renderFileOperation}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
