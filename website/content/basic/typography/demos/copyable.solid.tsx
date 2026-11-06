import { IconSetting } from '@fibrae/semi-icons-solid';
import { Typography, TextArea, Button, Toast } from '@fibrae/semi-ui-solid';

const timestamp = 1700000000;

export default function TypographyDemo() {
    return (
        <div>
            <Typography.Paragraph copyable>点击右边的图标复制文本。</Typography.Paragraph>
            <Typography.Paragraph copyable={{ content: 'Hello, Semi Design!' }}>点击复制文本。</Typography.Paragraph>
            <Typography.Paragraph copyable={{ onCopy: () => Toast.success({ content: '复制文本成功' }) }}>点击右边的图标复制文本。</Typography.Paragraph>
            时间戳:{' '}
            <Typography.Numeral truncate="ceil" copyable underline>
                {timestamp}s
            </Typography.Numeral>
            <Typography.Paragraph copyable={{ icon: () => <IconSetting style={{ color: 'var(--semi-color-link)' }} /> }}>自定义复制节点</Typography.Paragraph>
            <Typography.Paragraph
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
            </Typography.Paragraph>
            <br />
            <br />
            <Typography.Text id="typography-copyable-paste" type="secondary">
                粘贴区域：
            </Typography.Text>
            <br />
            <TextArea aria-labelledby="typography-copyable-paste" autosize style={{ width: '320px', 'margin-block-start': '4px' }} rows={3} />
        </div>
    );
}
