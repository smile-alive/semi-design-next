import { Tabs, TabPane } from '@fibrae/semi-ui-react';

const indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const positions = ['start', 'both', 'end'] as const;

export default function TabsDemo() {
    // Astro's React renderer only claims components that return an element, not an array
    return (
        <>
            {positions.map((position) => (
                <Tabs key={position} style={{ width: '60%', margin: '20px' }} type="card" collapsible arrowPosition={position}>
                    {indexes.map((i) => (
                        <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`} key={i}>
                            Content of card tab {i}
                        </TabPane>
                    ))}
                </Tabs>
            ))}
        </>
    );
}
