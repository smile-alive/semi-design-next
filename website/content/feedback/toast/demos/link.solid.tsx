import { Button, Toast, Typography } from '@fibrae/semi-ui-solid';

// content as a function: the toast creates it when shown, under its own root
const opts = {
    content: () => (
        <span>
            <Typography.Text>Hi, Bytedance dance dance</Typography.Text>
            <Typography.Text link style={{ 'margin-inline-start': '12px' }}>
                更多
            </Typography.Text>
        </span>
    ),
    duration: 3,
};

const multiLineOpts = {
    content: () => (
        <>
            <div>Hi, Bytedance dance dance</div>
            <div style={{ 'margin-block-start': '8px' }}>
                <Typography.Text link>查看详情</Typography.Text>
                <Typography.Text link style={{ 'margin-inline-start': '20px' }}>
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
