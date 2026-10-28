import { createSignal } from 'solid-js';
import { SideSheet, Button } from '@fibrae/semi-ui-solid';

export default function SideSheetDemo() {
    const [visible, setVisible] = createSignal(false);
    const getContainer = () => {
        return document.querySelector('.sidesheet-container') as HTMLElement;
    };
    return (
        <div
            style={{
                height: '320px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--semi-color-border)',
                'border-radius': '2px',
                padding: '24px',
                'text-align': 'center',
                background: 'var(--semi-color-fill-0)',
            }}
            class="sidesheet-container"
        >
            <span>Render in this</span>
            <br />
            <br />
            <Button onClick={() => setVisible(true)}>Open SideSheet</Button>
            <SideSheet title="渲染在指定容器内部" visible={visible()} onCancel={() => setVisible(false)} width={220} getPopupContainer={getContainer}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </SideSheet>
        </div>
    );
}
