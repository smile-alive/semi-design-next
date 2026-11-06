import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, type UploadOnChangeProps } from '@fibrae/semi-ui-react';

const limit = 1;

export default function UploadDemo() {
    const onChange = (props: UploadOnChangeProps) => {
        console.log(props.fileList);
    };
    return (
        <Upload action="https://api.semi.design/upload" limit={limit} onChange={onChange}>
            <Button icon={<IconUpload />} theme="light">
                点击上传（最多{limit}项）
            </Button>
        </Upload>
    );
}
