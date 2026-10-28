import { createSignal } from 'solid-js';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Popover, RadioGroup, Radio, Empty } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    const [visible, setVisible] = createSignal(false);
    return (
        <Popover
            visible={visible()}
            trigger="custom"
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
            {(trigger) => (
                <RadioGroup {...trigger()} type="button" onChange={(e) => setVisible(e.target.value)} value={visible()}>
                    <Radio value>受控显示</Radio>
                    <Radio value={false}>受控隐藏</Radio>
                </RadioGroup>
            )}
        </Popover>
    );
}
