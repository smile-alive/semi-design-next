import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Popover, Space, Empty, Tag } from '@fibrae/semi-ui-solid';

const style = { border: '2px solid var(--semi-color-border)', 'padding-left': '4px', 'padding-right': '4px', 'border-radius': '4px' };

const content = () => (
    <Empty
        title="先进的设计 / 研发协作方式"
        image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />}
        darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />}
        description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
        style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
    />
);

export default function PopoverDemo() {
    return (
        <Space>
            <Popover content={content}>
                {(trigger) => (
                    <span {...trigger()} style={style}>
                        Function
                    </span>
                )}
            </Popover>
            <Popover content={content}>
                <Tag style={style}>Component</Tag>
            </Popover>
            <Popover content={content}>
                <span style={style}>DOM</span>
            </Popover>
        </Space>
    );
}
