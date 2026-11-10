import { useState } from 'react';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-react/illustrations';
import { Popover, RadioGroup, Radio, Empty } from '@fibrae/semi-ui-react';

const content = <Empty title="先进的设计 / 研发协作方式" image={<IllustrationSuccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />} description="一套组件，四个框架原生可用" style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }} />;

export default function PopoverDemo() {
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
