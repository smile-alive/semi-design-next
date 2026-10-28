import { Typography } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    const { Paragraph, Title, Text } = Typography;

    return (
        <div>
            <Title heading={5} ellipsis={{ showTooltip: true }} style={{ width: 250 }}>
                是一个很长很长很长很长5号标题
            </Title>
            <br />
            <Text link ellipsis={{ showTooltip: true, pos: 'middle' }} style={{ width: 150 }}>
                是一个很长很长很长很长的链接
            </Text>
            <br />
            <br />
            <Paragraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: { width: 300 } } } }} style={{ width: 300 }}>
                多行截断，展示 Popover：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Paragraph>
        </div>
    );
}
