import { For } from 'solid-js';
import { Tabs, TabPane } from '@fibrae/semi-ui-solid';

const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function TabsDemo() {
    return (
        <Tabs more={4} style={{ width: '60%', margin: '20px' }} type="card">
            <For each={indexes}>
                {(i) => (
                    <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`}>
                        Content of card tab {i}
                    </TabPane>
                )}
            </For>
        </Tabs>
    );
}
