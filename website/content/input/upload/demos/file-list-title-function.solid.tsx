import { IconClose, IconUpload } from '@fibrae/semi-icons-solid';
import { Button, type FileItem, Upload } from '@fibrae/semi-ui-solid';

const action = 'https://api.semi.design/upload';

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

export default function UploadDemo() {
    return (
        <>
            <Upload
                action={action}
                defaultFileList={defaultFileList}
                style={{ 'margin-bottom': '20px' }}
                fileListTitle={({ fileList, onClear, clearText }) => (
                    <div
                        style={{
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'space-between',
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
                            'align-items': 'center',
                            'justify-content': 'space-between',
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
                                padding: '0',
                                border: 'none',
                                background: 'none',
                                font: 'inherit',
                                cursor: 'pointer',
                                color: 'var(--semi-color-link)',
                                'font-size': '12px',
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
