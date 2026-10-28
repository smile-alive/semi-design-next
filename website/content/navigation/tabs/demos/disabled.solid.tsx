import { Tabs, TabPane } from '@fibrae/semi-ui-solid';

export default function TabsDemo() {
    return (
        <Tabs defaultActiveKey="1">
            <TabPane tab="文档" itemKey="1">
                文档
            </TabPane>
            <TabPane tab="快速起步" itemKey="2" disabled>
                快速起步
            </TabPane>
            <TabPane tab="帮助" itemKey="3">
                帮助
            </TabPane>
        </Tabs>
    );
}
