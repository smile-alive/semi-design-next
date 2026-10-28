import { Tabs, TabPane } from '@fibrae/semi-ui-react';

export default function TabsDemo() {
    return (
        <Tabs
            defaultActiveKey="1"
            renderTabBar={(tabBarProps, DefaultTabBar) => {
                return (
                    <div className="tab-bar-box">
                        这是二次封装的Tab Bar，当前ActiveKey：{tabBarProps.activeKey}
                        <DefaultTabBar {...tabBarProps} />
                    </div>
                );
            }}
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
