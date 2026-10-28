import { createSignal } from 'solid-js';
import { SideSheet, Button } from '@fibrae/semi-ui-solid';

export default function SideSheetDemo() {
    const [visible, setVisible] = createSignal(false);
    const change = () => {
        setVisible(!visible());
    };
    return (
        <>
            <Button onClick={change}>Open SideSheet</Button>
            <SideSheet title="滑动侧边栏" visible={visible()} onCancel={change}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </>
    );
}
