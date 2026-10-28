import { Button, Notification, Typography } from '@fibrae/semi-ui-solid';

const { Text } = Typography;

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
                            <div style={{ 'margin-top': '8px' }}>
                                <Text link>查看详情</Text>
                                <Text link style={{ 'margin-left': '20px' }}>
                                    一会再看
                                </Text>
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
