import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type UploadOnChangeProps } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    let action = 'https://api.semi.design/upload';
    let limit = 1;
    let onChange = (props: UploadOnChangeProps) => {
        console.log(props.fileList);
    };
    return (
        <Upload action={action} limit={limit} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
