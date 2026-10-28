import { IconUpload, IconClose } from '@fibrae/semi-icons-react';
import { Upload, Button, type FileItem } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'document.pdf',
            status: 'success',
            size: '130KB',
        },
        {
            uid: '2',
            name: 'report.xlsx',
            status: 'success',
            size: '222KB',
        },
    ];

    return (
        <>
            <Upload
                action={action}
                defaultFileList={defaultFileList}
                style={{ marginBottom: 20 }}
                fileListTitle={({ fileList, onClear, clearText }) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <span style={{ color: 'var(--semi-color-primary)' }}>📂 共 {fileList.length} 个文件</span>
                        <Button size="small" type="danger" icon={<IconClose />} onClick={onClear}>
                            {clearText}
                        </Button>
                    </div>
                )}
            >
                <Button icon={<IconUpload />} theme="light">
                    自定义清空按钮样式
                </Button>
            </Upload>
            <Upload
                action={action}
                defaultFileList={defaultFileList}
                fileListTitle={({ fileList, onClear }) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <span>
                            已选择 <strong style={{ color: 'var(--semi-color-danger)' }}>{fileList.length}</strong> 个文件
                        </span>
                        <button
                            type="button"
                            onClick={onClear}
                            style={{
                                padding: 0,
                                border: 'none',
                                background: 'none',
                                font: 'inherit',
                                cursor: 'pointer',
                                color: 'var(--semi-color-link)',
                                fontSize: 12,
                            }}
                        >
                            全部移除
                        </button>
                    </div>
                )}
            >
                <Button icon={<IconUpload />} theme="light">
                    完全自定义标题区域
                </Button>
            </Upload>
        </>
    );
}
