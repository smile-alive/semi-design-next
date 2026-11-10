import { Card, Typography } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    return (
        <Card title="Semi Design" style={{ maxWidth: 360 }} headerExtraContent={<Typography.Text link>更多</Typography.Text>}>
            Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
        </Card>
    );
}
