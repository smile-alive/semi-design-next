import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-solid/illustrations';
import { Popover, Space, Empty, Tag } from '@fibrae/semi-ui-solid';

const style = { border: '2px solid var(--semi-color-border)', 'padding-inline-start': '4px', 'padding-inline-end': '4px', 'border-radius': '4px' };

const content = () => (
    <Empty
        title="先进的设计 / 研发协作方式"
        image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />}
        darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />}
        description="一套组件，四个框架原生可用"
        style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
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
