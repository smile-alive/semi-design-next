import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Popover, Tag, Empty } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    return (
        <Popover
            content={() => (
                <Empty
                    title="先进的设计 / 研发协作方式"
                    image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />}
                    darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />}
                    description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
                    style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
                />
            )}
        >
            <Tag>悬停此处</Tag>
        </Popover>
    );
}
