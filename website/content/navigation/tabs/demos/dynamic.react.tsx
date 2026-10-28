import { useRef, useState } from 'react';
import { Tabs, TabPane, ButtonGroup, Button } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    const newTabIndex = useRef(0);
    const [panes, setPanes] = useState([
        { title: 'Tab 1', content: 'Content of Tab Pane 1', itemKey: '1' },
        { title: 'Tab 2', content: 'Content of Tab Pane 2', itemKey: '2' },
    ]);
    const [activeKey, setActiveKey] = useState('1');

    const add = () => {
        const index = newTabIndex.current++;
        setPanes([...panes, { title: `New Tab ${index}`, content: 'New Tab Pane', itemKey: `newTab${index}` }]);
        setActiveKey(`newTab${index}`);
    };

    const remove = () => {
        if (panes.length > 1) {
            const rest = panes.slice(0, -1);
            setPanes(rest);
            setActiveKey(rest[rest.length - 1].itemKey);
        }
    };

    return (
        <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            tabBarExtraContent={
                <ButtonGroup>
                    <Button onClick={add}>新增</Button>
                    <Button onClick={remove}>删除</Button>
                </ButtonGroup>
            }
        >
            {panes.map((pane) => (
                <TabPane tab={pane.title} itemKey={pane.itemKey} key={pane.itemKey}>
                    {pane.content}
                </TabPane>
            ))}
        </Tabs>
    );
}
