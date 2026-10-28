import { useState } from 'react';
import { Tabs } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    const [key, setKey] = useState('1');

    const contentList = ['文档', '快速起步', '帮助'];
    const tabList = [
        { tab: '文档', itemKey: '1' },
        { tab: '快速起步', itemKey: '2' },
        { tab: '帮助', itemKey: '3' },
    ];
    return (
        <Tabs type="card" tabList={tabList} onChange={setKey}>
            <div>{contentList[Number(key) - 1]}</div>
        </Tabs>
    );
}
