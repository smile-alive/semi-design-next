import { Card, TabPane, Tabs } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    return (
        <Card title="Card title">
            <Tabs type="line" style={{ 'margin-top': '-20px', 'margin-bottom': '-20px' }}>
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
