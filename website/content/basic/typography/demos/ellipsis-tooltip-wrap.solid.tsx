import { Typography } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    const { Text } = Typography;

    return (
        <div>
            <Text
                ellipsis={{
                    showTooltip: {
                        opts: { content: '架构|Semi-inf|graph.cheet.relation' },
                    },
                }}
                style={{ width: '150px' }}
            >
                有问题的超长文本发生截断时可按需进行自定义配置
            </Text>
            <br />
            <Text
                ellipsis={{
                    showTooltip: {
                        opts: {
                            content: '架构|Semi-inf|graph.cheet.relation',
                            class: 'components-typography-demo',
                        },
                    },
                }}
                style={{ width: '150px' }}
            >
                覆盖类名超长文本发生截断时可使用类名覆盖进行自定义配置
            </Text>
            <br />
            <Text
                ellipsis={{
                    showTooltip: {
                        opts: { content: '架构|Semi-inf|graph.cheet.relation', style: { 'word-break': 'break-all' } },
                    },
                }}
                style={{ width: '150px' }}
            >
                覆盖style超长文本发生截断时可使用style进行自定义配置
            </Text>
        </div>
    );
}
