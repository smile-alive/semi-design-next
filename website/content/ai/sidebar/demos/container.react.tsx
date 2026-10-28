import { useState, useCallback, type CSSProperties } from 'react';
import { Sidebar } from '@fibrae/semi-ai-react';
import { Button, Switch } from '@fibrae/semi-ui-react';

const { Container } = Sidebar;
const containerStyle: CSSProperties = {
    display: 'flex',
    height: '500px',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 8,
    overflow: 'hidden',
    boxSizing: 'border-box',
};

export default function SidebarDemo() {
    const [visible, setVisible] = useState(true);
    const [motion, setMotion] = useState(true);
    const [resizable, setResizable] = useState(true);

    const toggleVisible = useCallback(() => {
        setVisible((visible) => !visible);
    }, []);

    const onMotionChange = useCallback((checked: boolean) => {
        setMotion(checked);
    }, []);

    const onResizableChange = useCallback((checked: boolean) => {
        setResizable(checked);
    }, []);

    return (
        <div style={containerStyle}>
            <div style={{ flexGrow: 1, flexShrink: 1, padding: 20 }}>
                <div>
                    <Button aria-pressed={visible} onClick={toggleVisible}>
                        显示容器
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
                        <span id="sidebar-container-motion">是否有动画</span> <Switch aria-labelledby="sidebar-container-motion" checked={motion} onChange={onMotionChange} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
                        <span id="sidebar-container-resizable">是否可伸缩</span> <Switch aria-labelledby="sidebar-container-resizable" checked={resizable} onChange={onResizableChange} />
                    </div>
                </div>
            </div>
            <Container motion={motion} resizable={resizable} minWidth={250} maxWidth="60%" visible={visible} title="基础容器示例" style={resizable ? {} : { width: 200 }} onCancel={toggleVisible} />
        </div>
    );
}
