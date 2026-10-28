import { Button, Toast, Typography } from '@fibrae/semi-ui-solid';

const { Text } = Typography;

// content as a function: the toast creates it when shown, under its own root
const opts = {
    content: () => (
        <span>
            <Text>Hi, Bytedance dance dance</Text>
            <Text link style={{ 'margin-left': '12px' }}>
                更多
            </Text>
        </span>
    ),
    duration: 3,
};

const multiLineOpts = {
    content: () => (
        <>
            <div>Hi, Bytedance dance dance</div>
            <div style={{ 'margin-top': '8px' }}>
                <Text link>查看详情</Text>
                <Text link style={{ 'margin-left': '20px' }}>
                    一会再看
                </Text>
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
