import { IconSetting } from '@fibrae/semi-icons-solid';
import { Typography, TextArea, Button, Toast } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    const { Paragraph, Text, Numeral } = Typography;
    const timestamp = new Date(2024, 4, 6, 12).getTime() / 1000;

    return (
        <div>
            <Paragraph copyable>点击右边的图标复制文本。</Paragraph>
            <Paragraph copyable={{ content: 'Hello, Semi Design!' }}>点击复制文本。</Paragraph>
            <Paragraph copyable={{ onCopy: () => Toast.success({ content: '复制文本成功' }) }}>点击右边的图标复制文本。</Paragraph>
            时间戳:{' '}
            <Numeral truncate="ceil" copyable underline>
                {timestamp}s
            </Numeral>
            <Paragraph copyable={{ icon: () => <IconSetting style={{ color: 'var(--semi-color-link)' }} /> }}>自定义复制节点</Paragraph>
            <Paragraph
                copyable={{
                    content: 'Custom render!',
                    render: (copied, doCopy, config) => (
                        <Button size="small" onClick={doCopy}>
                            <span>{copied ? '复制成功' : `点击复制:${config.content}`}</span>
                        </Button>
                    ),
                }}
            >
                自定义复制渲染
            </Paragraph>
            <br />
            <br />
            <Text id="typography-copyable-paste" type="secondary">
                粘贴区域：
            </Text>
            <br />
            <TextArea aria-labelledby="typography-copyable-paste" autosize style={{ width: '320px', 'margin-top': '4px' }} rows={3} />
        </div>
    );
}
