import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-react/illustrations';
import { Popover, Tag, Empty } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    return (
        <Popover
            content={
                <Empty title="先进的设计 / 研发协作方式" image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="一套组件，四个框架原生可用" style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }} />
            }
        >
            <Tag>悬停此处</Tag>
        </Popover>
    );
}
