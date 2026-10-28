import { createSignal, For } from 'solid-js';
import { Tabs, TabPane, Button } from '@fibrae/semi-ui-solid';

export default function TabsDemo() {
    const [count, setCount] = createSignal(8);

    const indexes = () => Array.from({ length: count() }, (_, i) => i);

    // Nodes can be placed once, so each Tabs gets its own copy
    const panes = () => (
        <For each={indexes()}>
            {(i) => (
                <TabPane tab={`Tab-${i + 1}`} itemKey={`${i}`}>
                    Content of Tab {i + 1}
                </TabPane>
            )}
        </For>
    );

    return (
        <div>
            <div style={{ 'margin-bottom': '12px' }}>
                <Button onClick={() => setCount(Math.max(3, count() - 2))} style={{ 'margin-right': '8px' }}>
                    减少 Tab
                </Button>
                <Button onClick={() => setCount(Math.min(15, count() + 2))}>增加 Tab</Button>
                <span style={{ 'margin-left': '12px' }}>当前 Tab 数量: {count()}</span>
            </div>

            <div style={{ border: '1px solid var(--semi-color-border)', padding: '12px', 'margin-bottom': '16px' }}>
                <p style={{ 'margin-bottom': '8px', color: 'var(--semi-color-text-2)', 'font-size': '12px' }}>collapsible=&quot;auto&quot; - 自动检测溢出</p>
                <Tabs type="card" collapsible="auto">
                    {panes()}
                </Tabs>
            </div>

            <div style={{ border: '1px solid var(--semi-color-border)', padding: '12px', 'max-width': '400px' }}>
                <p style={{ 'margin-bottom': '8px', color: 'var(--semi-color-text-2)', 'font-size': '12px' }}>固定宽度 400px，测试较窄容器</p>
                <Tabs type="card" collapsible="auto">
                    {panes()}
                </Tabs>
            </div>
        </div>
    );
}
