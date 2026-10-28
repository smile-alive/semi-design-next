import { useState } from 'react';
import { SideSheet, Button } from '@fibrae/semi-ui-react';

export default function SideSheetDemo() {
    const [visible, setVisible] = useState(false);
    const getContainer = () => {
        return document.querySelector('.sidesheet-container') as HTMLElement;
    };
    return (
        <div
            style={{
                height: 320,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--semi-color-border)',
                borderRadius: 2,
                padding: 24,
                textAlign: 'center',
                background: 'var(--semi-color-fill-0)',
            }}
            className="sidesheet-container"
        >
            <span>Render in this</span>
            <br />
            <br />
            <Button onClick={() => setVisible(true)}>Open SideSheet</Button>
            <SideSheet title="渲染在指定容器内部" visible={visible} onCancel={() => setVisible(false)} width={220} getPopupContainer={getContainer}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </div>
    );
}
