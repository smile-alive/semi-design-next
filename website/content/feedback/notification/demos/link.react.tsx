import { Notification, Button, Typography } from '@fibrae/semi-ui-react';

const opts = {
    title: 'This is a title',
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

export default function NotificationDemo() {
    return <Button onClick={() => Notification.info(opts)}>Display Notification</Button>;
}
