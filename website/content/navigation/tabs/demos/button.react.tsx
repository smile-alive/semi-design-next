import { Tabs, TabPane } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    return (
        <Tabs type="button">
            <TabPane tab="文档" itemKey="1">
                文档
            </TabPane>
            <TabPane tab="快速起步" itemKey="2">
                快速起步
            </TabPane>
            <TabPane tab="帮助" itemKey="3">
                帮助
            </TabPane>
        </Tabs>
    );
}
