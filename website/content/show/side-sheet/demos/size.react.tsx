import { useState } from 'react';
import { SideSheet, RadioGroup, Radio, Button, type SideSheetProps, type RadioChangeEvent } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const change = () => {
        setVisible(!visible);
    };
    const [size, setSize] = useState<SideSheetProps['size']>('small');
    const changeSize = (e: RadioChangeEvent) => {
        setSize(e.target.value);
    };
    return (
        <>
            <RadioGroup aria-label="侧边栏尺寸" onChange={changeSize} value={size}>
                <Radio value="small">small</Radio>
                <Radio value="medium">medium</Radio>
                <Radio value="large">large</Radio>
            </RadioGroup>
            <br />
            <br />
            <Button onClick={change}>Open SideSheet</Button>
            <SideSheet title="滑动侧边栏" visible={visible} onCancel={change} size={size}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </>
    );
}
