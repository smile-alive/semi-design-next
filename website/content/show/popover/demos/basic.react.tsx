import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-react';
import { Popover, Tag, Empty } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    return (
        <Popover
            content={
                <Empty
                    title="先进的设计 / 研发协作方式"
                    image={<IllustrationSuccess style={{ width: 150, height: 150 }} />}
                    darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />}
                    description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
                    style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }}
                />
            }
        >
            <Tag>悬停此处</Tag>
        </Popover>
    );
}
