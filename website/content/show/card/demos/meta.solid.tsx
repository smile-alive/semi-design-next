import { Avatar, Button, Card, Space, Typography } from '@fibrae/semi-ui-solid';

const avatarSrc = '/assets/placeholder/logo.svg';
const coverSrc = '/assets/root-web-sites/card-cover-docs-demo.jpeg';

export default function CardDemo() {
    return (
        <Card
            style={{ 'max-width': '340px' }}
            title={<Card.Meta title="Semi Doc" description="全面、易用、优质" avatar={<Avatar alt="Card meta img" size="default" src={avatarSrc} />} />}
            headerExtraContent={<Typography.Text link>More</Typography.Text>}
            cover={<img alt="example" src={coverSrc} />}
            footerLine
            footerStyle={{ display: 'flex', 'justify-content': 'flex-end' }}
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
