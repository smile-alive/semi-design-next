import { useState } from 'react';
import { Tooltip, Button, Input, RadioGroup, Radio } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <Tooltip content="hi bytedance">
                <Button theme="solid" type="tertiary" style={{ marginBottom: 20 }}>
                    悬停显示
                </Button>
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="click">
                <Button style={{ marginBottom: 20 }}>点击显示</Button>
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="focus">
                <Input aria-label="聚焦显示" style={{ width: 100, marginBottom: 20 }} placeholder="聚焦显示" />
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="contextMenu">
                <Button theme="solid" type="secondary" style={{ marginBottom: 20 }}>
                    右键点击展示
                </Button>
            </Tooltip>
            <br />
            <Tooltip content="hi bytedance" trigger="custom" visible={visible}>
                <span style={{ display: 'inline-block' }}>
                    <RadioGroup type="button" onChange={(e) => setVisible(e.target.value)} value={visible}>
                        <Radio value>受控显示</Radio>
                        <Radio value={false}>受控隐藏</Radio>
                    </RadioGroup>
                </span>
            </Tooltip>
        </div>
    );
}
