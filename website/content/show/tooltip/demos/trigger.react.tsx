import { useState } from 'react';
import { Tooltip, Button, Input, RadioGroup, Radio } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <Tooltip content="hi semi">
                <Button theme="solid" type="tertiary" style={{ marginBlockEnd: 20 }}>
                    悬停显示
                </Button>
            </Tooltip>
            <br />
            <Tooltip content="hi semi" trigger="click">
                <Button style={{ marginBlockEnd: 20 }}>点击显示</Button>
            </Tooltip>
            <br />
            <Tooltip content="hi semi" trigger="focus">
                <Input aria-label="聚焦显示" style={{ width: 100, marginBlockEnd: 20 }} placeholder="聚焦显示" />
            </Tooltip>
            <br />
            <Tooltip content="hi semi" trigger="contextMenu">
                <Button theme="solid" type="secondary" style={{ marginBlockEnd: 20 }}>
                    右键点击展示
                </Button>
            </Tooltip>
            <br />
            <Tooltip content="hi semi" trigger="custom" visible={visible}>
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
