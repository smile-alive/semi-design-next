import { Card, Avatar, Space, Button, Typography } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Meta } = Card;
    const { Text } = Typography;

    return (
        <Card
            style={{ maxWidth: 340 }}
            title={<Meta title="Semi Doc" description="全面、易用、优质" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />}
            headerExtraContent={<Text link>More</Text>}
            cover={<img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />}
            footerLine
            footerStyle={{ display: 'flex', justifyContent: 'flex-end' }}
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
            Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。
        </Card>
    );
}
