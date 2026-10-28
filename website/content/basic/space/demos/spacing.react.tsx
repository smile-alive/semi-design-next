import { Space, Tabs, TabPane, Button } from '@fibrae/semi-ui-react';

export default function SpaceDemo() {
    return (
        <Tabs type="line">
            <TabPane tab="tight" itemKey="1">
                <Space spacing="tight" style={{ marginTop: '15px' }}>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                </Space>
            </TabPane>
            <TabPane tab="medium" itemKey="2">
                <Space spacing="medium" style={{ marginTop: '15px' }}>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                </Space>
            </TabPane>
            <TabPane tab="loose" itemKey="3">
                <Space spacing="loose" style={{ marginTop: '15px' }}>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                </Space>
            </TabPane>
            <TabPane tab="array" itemKey="4">
                <Space spacing={[8, 16]} wrap style={{ marginTop: '15px' }}>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                </Space>
            </TabPane>
        </Tabs>
    );
}
