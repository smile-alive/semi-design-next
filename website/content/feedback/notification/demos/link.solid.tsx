import { Button, Notification, Typography } from '@fibrae/semi-ui-solid';

export default function NotificationDemo() {
    // content is JSX built inside the handler: a static notification renders it once, so each click needs a new node
    return (
        <Button
            onClick={() =>
                Notification.info({
                    title: 'This is a title',
                    content: (
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
                })
            }
        >
            Display Notification
        </Button>
    );
}
