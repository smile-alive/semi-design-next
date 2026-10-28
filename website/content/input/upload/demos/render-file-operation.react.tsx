import { IconUpload, IconDownload, IconEyeOpened, IconDelete } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem, type RenderFileItemProps } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';

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
        <div style={{ display: 'flex', columnGap: 8, padding: '0 8px' }}>
            <Button aria-label="预览" icon={<IconEyeOpened />} type="tertiary" theme="borderless" size="small" />
            <Button aria-label="下载" icon={<IconDownload />} type="tertiary" theme="borderless" size="small" />
            <Button onClick={() => fileItem.onRemove?.()} aria-label="删除" icon={<IconDelete />} type="tertiary" theme="borderless" size="small" />
        </div>
    );
    return (
        <Upload action={action} defaultFileList={defaultFileList} itemStyle={{ width: 300 }} renderFileOperation={renderFileOperation}>
            <Button icon={<IconUpload />} theme="light">
                点击上传
            </Button>
        </Upload>
    );
}
