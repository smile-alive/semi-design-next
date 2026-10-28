import { Card, Typography } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card title="Semi Design" style={{ 'max-width': '360px' }} headerExtraContent={<Typography.Text link>更多</Typography.Text>}>
            Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
        </Card>
    );
}
