import { createSignal } from 'solid-js';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Toast, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-solid';

const limit = 2;

export default function UploadDemo() {
    const [disabled, setDisabled] = createSignal(false);

    const onChange = ({ fileList }: UploadOnChangeProps) => {
        setDisabled(fileList.length === limit);
    };

    return (
        <Upload action="https://api.semi.design/upload" limit={limit} onExceed={() => Toast.warning(`最多只允许上传${limit}个文件`)} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light" disabled={disabled()}>
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
