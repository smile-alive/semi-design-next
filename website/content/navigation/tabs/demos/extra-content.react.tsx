import { Tabs, TabPane, Button } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    return (
        <Tabs
            defaultActiveKey="1"
            tabBarExtraContent={
                <Button
                    onClick={() => {
                        alert('you have clicked me!');
                    }}
                >
                    Extra Action
                </Button>
            }
        >
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
