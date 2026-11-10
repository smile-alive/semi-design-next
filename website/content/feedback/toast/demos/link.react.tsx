import { Toast, Typography, Button } from '@fibrae/semi-ui-react';

const opts = {
    content: (
        <span>
            <Typography.Text>Hi, Semi dance dance</Typography.Text>
            <Typography.Text link style={{ marginInlineStart: 12 }}>
                更多
            </Typography.Text>
        </span>
    ),
    duration: 3,
};

const multiLineOpts = {
    content: (
        <>
            <div>Hi, Semi dance dance</div>
            <div style={{ marginBlockStart: 8 }}>
                <Typography.Text link>查看详情</Typography.Text>
                <Typography.Text link style={{ marginInlineStart: 20 }}>
                    一会再看
                </Typography.Text>
            </div>
        </>
    ),
    duration: 3,
};

export default function ToastDemo() {
    return (
        <>
            <Button onClick={() => Toast.info(opts)}>Display Toast</Button>
            <br />
            <br />
            <Button onClick={() => Toast.info(multiLineOpts)}>Display Multi-line Toast</Button>
        </>
    );
}
