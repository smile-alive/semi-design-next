import { createSignal, For } from 'solid-js';
import { Tabs, TabPane, ButtonGroup, Button } from '@fibrae/semi-ui-solid';

export default function TabsDemo() {
    let newTabIndex = 0;
    const [panes, setPanes] = createSignal([
        { title: 'Tab 1', content: 'Content of Tab Pane 1', itemKey: '1' },
        { title: 'Tab 2', content: 'Content of Tab Pane 2', itemKey: '2' },
    ]);
    const [activeKey, setActiveKey] = createSignal('1');

    const add = () => {
        const index = newTabIndex++;
        setPanes([...panes(), { title: `New Tab ${index}`, content: 'New Tab Pane', itemKey: `newTab${index}` }]);
        setActiveKey(`newTab${index}`);
    };

    const remove = () => {
        if (panes().length > 1) {
            const rest = panes().slice(0, -1);
            setPanes(rest);
            setActiveKey(rest[rest.length - 1].itemKey);
        }
    };

    return (
        <Tabs
            activeKey={activeKey()}
            onChange={setActiveKey}
            tabBarExtraContent={
                <ButtonGroup>
                    <Button onClick={add}>新增</Button>
                    <Button onClick={remove}>删除</Button>
                </ButtonGroup>
            }
        >
            <For each={panes()}>
                {(pane) => (
                    <TabPane tab={pane.title} itemKey={pane.itemKey}>
                        {pane.content}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}
