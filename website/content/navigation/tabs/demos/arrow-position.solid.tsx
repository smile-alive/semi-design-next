import { For } from 'solid-js';
import { Tabs, TabPane } from '@fibrae/semi-ui-solid';

const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const positions = ['start', 'both', 'end'] as const;

export default function TabsDemo() {
    return (
        <For each={positions}>
            {(position) => (
                <Tabs style={{ width: '60%', margin: '20px' }} type="card" collapsible arrowPosition={position}>
                    <For each={indexes}>
                        {(i) => (
                            <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`}>
                                Content of card tab {i}
                            </TabPane>
                        )}
                    </For>
                </Tabs>
            )}
        </For>
    );
}
