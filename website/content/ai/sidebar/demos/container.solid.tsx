import { type JSX, createSignal } from 'solid-js';
import { Sidebar } from '@fibrae/semi-ai-solid';
import { Button, Switch } from '@fibrae/semi-ui-solid';

const { Container } = Sidebar;
const containerStyle: JSX.CSSProperties = {
    display: 'flex',
    height: '500px',
    border: '1px solid var(--semi-color-border)',
    'border-radius': '8px',
    overflow: 'hidden',
    'box-sizing': 'border-box',
};

export default function SidebarDemo() {
    const [visible, setVisible] = createSignal(true);
    const [motion, setMotion] = createSignal(true);
    const [resizable, setResizable] = createSignal(true);

    const toggleVisible = () => setVisible((current) => !current);

    return (
        <div style={containerStyle}>
            <div style={{ 'flex-grow': 1, 'flex-shrink': 1, padding: '20px' }}>
                <div>
                    <Button aria-pressed={visible()} onClick={toggleVisible}>
                        显示容器
                    </Button>
                    <div style={{ display: 'flex', 'align-items': 'center', 'margin-top': '10px' }}>
                        <span id="sidebar-container-motion">是否有动画</span> <Switch aria-labelledby="sidebar-container-motion" checked={motion()} onChange={setMotion} />
                    </div>
                    <div style={{ display: 'flex', 'align-items': 'center', 'margin-top': '10px' }}>
                        <span id="sidebar-container-resizable">是否可伸缩</span> <Switch aria-labelledby="sidebar-container-resizable" checked={resizable()} onChange={setResizable} />
                    </div>
                </div>
            </div>
            <Container motion={motion()} resizable={resizable()} minWidth={250} maxWidth="60%" visible={visible()} title="基础容器示例" style={resizable() ? {} : { width: '200px' }} onCancel={toggleVisible} />
        </div>
    );
}
