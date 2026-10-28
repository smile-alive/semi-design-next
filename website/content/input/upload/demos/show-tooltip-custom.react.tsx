import { IconUpload } from '@fibrae/semi-icons-react';
import { Upload, Button, Tooltip } from '@fibrae/semi-ui-react';

export default function UploadDemo() {
    const action = 'https://api.semi.design/upload';
    const button = (
        <Button icon={<IconUpload />} theme="light">
            点击上传
        </Button>
    );
    return (
        <>
            <Upload
                action={action}
                showTooltip={{
                    renderTooltip: (content, children) => {
                        return (
                            <Tooltip content={content} position="bottom">
                                {children}
                            </Tooltip>
                        );
                    },
                }}
            >
                {button}
            </Upload>
        </>
    );
}
