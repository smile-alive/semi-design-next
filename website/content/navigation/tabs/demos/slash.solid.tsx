import { createSignal } from 'solid-js';
import { Tabs } from '@fibrae/semi-ui-solid';

const contentList = ['文档', '快速起步', '帮助'];
const tabList = [
    { tab: '文档', itemKey: '1' },
    { tab: '快速起步', itemKey: '2' },
    { tab: '帮助', itemKey: '3' },
];

export default function TabsDemo() {
    const [key, setKey] = createSignal('1');

    return (
        <Tabs type="slash" tabList={tabList} onChange={setKey}>
            <div>{contentList[Number(key()) - 1]}</div>
        </Tabs>
    );
}
