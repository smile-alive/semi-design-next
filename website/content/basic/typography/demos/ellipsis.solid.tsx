import type { JSX } from 'solid-js';
import { Typography, Tooltip, type TooltipProps } from '@fibrae/semi-ui-solid';

function renderBlueTooltip(content: TooltipProps['content'], children: JSX.Element) {
    return (
        <Tooltip content={content} style={{ 'background-color': 'var(--semi-color-primary)' }}>
            {children}
        </Tooltip>
    );
}

export default function TypographyDemo() {
    const { Paragraph, Title, Text } = Typography;

    return (
        <div>
            <Title heading={5} ellipsis={{ showTooltip: true }} style={{ width: '250px' }}>
                是一个很长很长很长很长5号标题
            </Title>
            <br />
            <Text
                ellipsis={{
                    showTooltip: {
                        opts: { content: '这是自定义要展示的内容' },
                    },
                }}
                style={{ width: '150px' }}
            >
                可以自定义浮层里的展示内容试试看吧
            </Text>
            <br />
            {/* link 也可以传对象，例如 link={{ href: 'https://semi.design/zh-CN/basic/typography', target: '_blank' }} */}
            <Text link ellipsis={{ showTooltip: true, pos: 'middle' }} style={{ width: '150px' }}>
                是一个很长很长很长很长的链接
            </Text>
            <br />
            <Paragraph ellipsis={{ suffix: '小尾巴' }} style={{ width: '300px' }}>
                有后缀的情况：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。
            </Paragraph>
            <br />
            <Paragraph ellipsis={{ rows: 3 }} style={{ width: '300px' }}>
                这是一个多行截断的例子：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Paragraph>
            <br />
            <Paragraph ellipsis={{ rows: 3, showTooltip: { type: 'popover', opts: { style: { width: '300px' } } } }} style={{ width: '300px' }}>
                多行截断，展示 Popover：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Paragraph>
            <br />
            <Paragraph
                ellipsis={{
                    rows: 3,
                    expandable: true,
                    collapsible: true,
                    collapseText: '折叠我吧',
                    onExpand: (bool, e) => console.log(bool, e),
                }}
                style={{ width: '300px' }}
            >
                支持展开和折叠：Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Paragraph>
            <br />
            <Text
                ellipsis={{
                    showTooltip: {
                        opts: { content: '全英文设置了word-break' },
                    },
                    pos: 'middle',
                }}
                style={{ width: '150px', 'word-break': 'break-word' }}
            >
                sssssssssssssssssssssssss
            </Text>
            <br />
            <br />
            <Title
                heading={5}
                ellipsis={{
                    showTooltip: {
                        renderTooltip: renderBlueTooltip,
                    },
                }}
                style={{ width: '250px' }}
            >
                这是一个自定义弹出层组件的省略文本，背景色是蓝色
            </Title>
        </div>
    );
}
