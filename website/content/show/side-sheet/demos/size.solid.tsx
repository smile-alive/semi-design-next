import { createSignal } from 'solid-js';
import { SideSheet, RadioGroup, Radio, Button, type SideSheetProps, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

export default function SideSheetDemo() {
    const [visible, setVisible] = createSignal(false);
    const change = () => {
        setVisible(!visible());
    };
    const [size, setSize] = createSignal<SideSheetProps['size']>('small');
    const changeSize = (e: RadioChangeEvent) => {
        setSize(e.target.value as SideSheetProps['size']);
    };
    return (
        <>
            <RadioGroup aria-label="侧边栏尺寸" onChange={changeSize} value={size()}>
                <Radio value="small">small</Radio>
                <Radio value="medium">medium</Radio>
                <Radio value="large">large</Radio>
            </RadioGroup>
            <br />
            <br />
            <Button onClick={change}>Open SideSheet</Button>
            <SideSheet title="滑动侧边栏" visible={visible()} onCancel={change} size={size()}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </>
    );
}
