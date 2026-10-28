import { useState } from 'react';
import { SideSheet, Button } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const change = () => {
        setVisible(!visible);
    };
    return (
        <>
            <Button onClick={change}>Open SideSheet</Button>
            <SideSheet title="滑动侧边栏" visible={visible} onCancel={change}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </>
    );
}
