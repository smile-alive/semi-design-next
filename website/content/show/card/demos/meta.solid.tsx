import { Avatar, Button, Card, Space, Typography } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card
            style={{ 'max-width': '340px' }}
            title={<Card.Meta title="Semi Doc" description="全面、易用、优质" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />}
            headerExtraContent={<Typography.Text link>More</Typography.Text>}
            cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />}
            footerLine
            styles={{ footer: { display: 'flex', 'justify-content': 'flex-end' } }}
            footer={
                <Space>
                    <Button theme="borderless" type="primary">
                        精选案例
                    </Button>
                    <Button theme="solid" type="primary">
                        开始使用
                    </Button>
                </Space>
            }
        >
            Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。
        </Card>
    );
}
