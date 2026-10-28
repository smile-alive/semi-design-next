import { createSignal } from 'solid-js';
import { Button, Input, Radio, RadioGroup, Tooltip } from '@fibrae/semi-ui-solid';

export default function TooltipDemo() {
    const [visible, setVisible] = createSignal(false);

    return (
        <div>
            <Tooltip content="hi bytedance">
                {(trigger) => (
                    <Button theme="solid" type="tertiary" style={{ 'margin-bottom': '20px' }} {...trigger()}>
                        悬停显示
                    </Button>
                )}
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="click">
                {(trigger) => (
                    <Button style={{ 'margin-bottom': '20px' }} {...trigger()}>
                        点击显示
                    </Button>
                )}
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="focus">
                {(trigger) => <Input aria-label="聚焦显示" style={{ width: '100px', 'margin-bottom': '20px' }} placeholder="聚焦显示" {...trigger()} />}
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="contextMenu">
                {(trigger) => (
                    <Button theme="solid" type="secondary" style={{ 'margin-bottom': '20px' }} {...trigger()}>
                        右键点击展示
                    </Button>
                )}
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="custom" visible={visible()}>
                {(trigger) => (
                    <span style={{ display: 'inline-block' }} {...trigger({ tabIndex: -1 })}>
                        <RadioGroup type="button" onChange={(e) => setVisible(Boolean(e.target.value))} value={visible()}>
                            <Radio value>受控显示</Radio>
                            <Radio value={false}>受控隐藏</Radio>
                        </RadioGroup>
                    </span>
                )}
            </Tooltip>
        </div>
    );
}
