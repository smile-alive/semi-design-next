import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-solid/illustrations';
import { Popover, Tag, Empty } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    return (
        <Popover
            content={() => (
                <Empty
                    title="先进的设计 / 研发协作方式"
                    image={<IllustrationSuccess style={{ width: '150px', height: '150px' }} />}
                    darkModeImage={<IllustrationSuccessDark style={{ width: '150px', height: '150px' }} />}
                    description="一套组件，四个框架原生可用"
                    style={{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }}
                />
            )}
        >
            <Tag>悬停此处</Tag>
        </Popover>
    );
}
