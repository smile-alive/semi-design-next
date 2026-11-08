import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-react/illustrations';
import { Popover, Space, Empty, Tag } from '@fibrae/semi-ui-react';

const style = { border: '2px solid var(--semi-color-border)', paddingInlineStart: 4, paddingInlineEnd: 4, borderRadius: 4 };

const content = (
    <Empty
        title="先进的设计 / 研发协作方式"
        image={<IllustrationSuccess style={{ width: 150, height: 150 }} />}
        darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />}
        description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
        style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }}
    />
);

export default function PopoverDemo() {
    return (
        <Space>
            <Popover content={content}>
                <Tag style={style}>Component</Tag>
            </Popover>
            <Popover content={content}>Text</Popover>
            <Popover content={content}>
                <span style={style}>DOM</span>
            </Popover>
        </Space>
    );
}
