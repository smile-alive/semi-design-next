import { useState } from 'react';
import { Tabs, TabPane, Button } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    const [count, setCount] = useState(8);

    const tabs = Array.from({ length: count }, (_, i) => (
        <TabPane tab={`Tab-${i + 1}`} itemKey={`${i}`} key={i}>
            Content of Tab {i + 1}
        </TabPane>
    ));

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <Button onClick={() => setCount(Math.max(3, count - 2))} style={{ marginRight: 8 }}>
                    减少 Tab
                </Button>
                <Button onClick={() => setCount(Math.min(15, count + 2))}>增加 Tab</Button>
                <span style={{ marginLeft: 12 }}>当前 Tab 数量: {count}</span>
            </div>

            <div style={{ border: '1px solid var(--semi-color-border)', padding: 12, marginBottom: 16 }}>
                <p style={{ marginBottom: 8, color: 'var(--semi-color-text-2)', fontSize: 12 }}>collapsible=&quot;auto&quot; - 自动检测溢出</p>
                <Tabs type="card" collapsible="auto">
                    {tabs}
                </Tabs>
            </div>

            <div style={{ border: '1px solid var(--semi-color-border)', padding: 12, maxWidth: 400 }}>
                <p style={{ marginBottom: 8, color: 'var(--semi-color-text-2)', fontSize: 12 }}>固定宽度 400px，测试较窄容器</p>
                <Tabs type="card" collapsible="auto">
                    {tabs}
                </Tabs>
            </div>
        </div>
    );
}
