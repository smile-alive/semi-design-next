import { Card, Tabs, TabPane } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    return (
        <Card title="Card title">
            <Tabs
                type="line"
                style={{
                    marginTop: -20,
                    marginBottom: -20,
                }}
            >
                <TabPane tab="Tab 1" itemKey="1">
                    <p>content1</p>
                    <p>content1</p>
                    <p>content1</p>
                </TabPane>
                <TabPane tab="Tab 2" itemKey="2">
                    <p>content2</p>
                    <p>content2</p>
                    <p>content2</p>
                </TabPane>
            </Tabs>
        </Card>
    );
}
