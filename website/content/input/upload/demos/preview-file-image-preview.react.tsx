import { useState } from 'react';
import { IconUpload, IconDownload, IconDelete, IconExpand } from '@fibrae/semi-icons-react';
import { Upload, Button, ImagePreview, type FileItem, type RenderFileItemProps } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

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
    const [visible, setVisible] = useState(false);
    const renderFileOperation = (fileItem: RenderFileItemProps) => (
        <div style={{ display: 'flex', columnGap: 8, padding: '0 8px' }}>
            <Button aria-label="预览" icon={<IconExpand />} type="tertiary" theme="borderless" size="small" onClick={() => setVisible(true)} />
            <Button aria-label="下载" icon={<IconDownload />} type="tertiary" theme="borderless" size="small" />
            <Button aria-label="删除" onClick={() => fileItem.onRemove?.()} icon={<IconDelete />} type="tertiary" theme="borderless" size="small" />
            <ImagePreview src={fileItem.url} visible={visible} onVisibleChange={setVisible} />
        </div>
    );
    return (
        <Upload action="/upload" customRequest={mockUpload} defaultFileList={defaultFileList} styles={{ item: { width: 300 } }} renderFileOperation={renderFileOperation}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
