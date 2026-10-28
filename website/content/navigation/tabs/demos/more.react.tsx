import { Tabs, TabPane } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    return (
        <Tabs more={4} style={{ width: '60%', margin: '20px' }} type="card">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <TabPane tab={`Tab-${i}`} itemKey={`Tab-${i}`} key={i}>
                    Content of card tab {i}
                </TabPane>
            ))}
        </Tabs>
    );
}
