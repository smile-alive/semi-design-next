import { createSignal } from 'solid-js';
import { SideSheet, TextArea, Button } from '@fibrae/semi-ui-solid';

export default function SideSheetDemo() {
    const [visible, setVisible] = createSignal(false);
    const [value, setValue] = createSignal('');
    return (
        <>
            <Button onClick={() => setVisible(true)}>Open SideSheet</Button>
            <TextArea placeholder="Please enter something" onChange={(value) => setValue(value)} style={{ 'margin-top': '12px' }} />
            <SideSheet title="可操作外部的侧边栏" visible={visible()} onCancel={() => setVisible(false)} mask={false} disableScroll={false}>
                <p>这里是输入的内容：</p>
                <p>{value()}</p>
            </SideSheet>
        </>
    );
}
