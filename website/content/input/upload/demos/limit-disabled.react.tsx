import { useState } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, Toast, type UploadOnChangeProps } from '@fibrae/semi-ui-react';

const limit = 2;

export default function UploadDemo() {
    const [disabled, setDisabled] = useState(false);
    const onChange = (props: UploadOnChangeProps) => {
        setDisabled(props.fileList.length === limit);
    };
    return (
        <Upload action="https://api.semi.design/upload" limit={limit} onExceed={() => Toast.warning(`最多只允许上传${limit}个文件`)} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light" disabled={disabled}>
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
