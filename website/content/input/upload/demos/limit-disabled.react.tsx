import { useState } from 'react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, Toast, type UploadOnChangeProps } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    let [disabled, setDisabled] = useState(false);
    let limit = 2;
    let onChange = (props: UploadOnChangeProps) => {
        let length = props.fileList.length;
        if (length === limit) {
            setDisabled(true);
        } else {
            setDisabled(false);
        }
    };
    return (
        <Upload action={action} limit={limit} onExceed={() => Toast.warning(`最多只允许上传${limit}个文件`)} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light" disabled={disabled}>
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
