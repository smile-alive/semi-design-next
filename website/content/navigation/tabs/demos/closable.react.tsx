import { useState } from 'react';
import { Tabs, TabPane } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    const [tabList, setTabList] = useState([
        { tab: '文档', itemKey: '1', text: '文档', closable: true },
        { tab: '快速起步', itemKey: '2', text: '快速起步', closable: true },
        { tab: '帮助', itemKey: '3', text: '帮助' },
    ]);

    const close = (key: string) => {
        setTabList(tabList.filter((t) => t.itemKey !== key));
    };

    return (
        <Tabs type="card" defaultActiveKey="1" onTabClose={close}>
            {tabList.map((t) => (
                <TabPane closable={t.closable} tab={t.tab} itemKey={t.itemKey} key={t.itemKey}>
                    {t.text}
                </TabPane>
            ))}
        </Tabs>
    );
}
