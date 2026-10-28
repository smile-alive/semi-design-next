import { useState } from 'react';
import { SideSheet, RadioGroup, Radio, Button, type SideSheetProps, type RadioChangeEvent } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const change = () => {
        setVisible(!visible);
    };
    const [placement, setPlacement] = useState<SideSheetProps['placement']>('right');
    const changePlacement = (e: RadioChangeEvent) => {
        setPlacement(e.target.value);
    };
    return (
        <>
            <RadioGroup aria-label="侧边栏位置" onChange={changePlacement} value={placement}>
                <Radio value="right">right</Radio>
                <Radio value="left">left</Radio>
                <Radio value="top">top</Radio>
                <Radio value="bottom">bottom</Radio>
            </RadioGroup>
            <br />
            <br />
            <Button onClick={change}>Open SideSheet</Button>
            <SideSheet title="滑动侧边栏" visible={visible} onCancel={change} placement={placement}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </>
    );
}
