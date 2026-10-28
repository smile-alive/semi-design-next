import { Notification, Button, Typography } from '@fibrae/semi-ui-react';

export default function NotificationDemo() {
    const { Text } = Typography;

    let opts = {
        title: 'This is a title',
        content: (
            <>
                <div>Hi, Bytedance dance dance</div>
                <div style={{ marginTop: 8 }}>
                    <Text link>查看详情</Text>
                    <Text link style={{ marginLeft: 20 }}>
                        一会再看
                    </Text>
                </div>
            </>
        ),
        duration: 3,
    };

    return <Button onClick={() => Notification.info(opts)}>Display Notification</Button>;
}
