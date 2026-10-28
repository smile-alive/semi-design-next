import { useState } from 'react';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-react';
import { Popover, RadioGroup, Radio, Empty } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    const content = (
        <Empty
            title="先进的设计 / 研发协作方式"
            image={<IllustrationSuccess style={{ width: 150, height: 150 }} />}
            darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />}
            description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
            style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }}
        />
    );
    const [visible, setVisible] = useState(false);
    return (
        <Popover visible={visible} content={content} trigger="custom">
            <RadioGroup type="button" onChange={(e) => setVisible(e.target.value)} value={visible}>
                <Radio value>受控显示</Radio>
                <Radio value={false}>受控隐藏</Radio>
            </RadioGroup>
        </Popover>
    );
}
