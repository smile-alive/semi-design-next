import { Space, Tabs, TabPane, Button } from '@fibrae/semi-ui-react';

const fourButtons = [1, 2, 3, 4];
const tenButtons = Array.from({ length: 10 }, (_, index) => index);

export default function SpaceDemo() {
    return (
        <Tabs type="line">
            <TabPane tab="tight" itemKey="1">
                <Space spacing="tight" style={{ marginBlockStart: '15px' }}>
                    {fourButtons.map((item) => (
                        <Button key={item} theme="solid" type="primary">
                            按钮
                        </Button>
                    ))}
                </Space>
            </TabPane>
            <TabPane tab="medium" itemKey="2">
                <Space spacing="medium" style={{ marginBlockStart: '15px' }}>
                    {fourButtons.map((item) => (
                        <Button key={item} theme="solid" type="primary">
                            按钮
                        </Button>
                    ))}
                </Space>
            </TabPane>
            <TabPane tab="loose" itemKey="3">
                <Space spacing="loose" style={{ marginBlockStart: '15px' }}>
                    {fourButtons.map((item) => (
                        <Button key={item} theme="solid" type="primary">
                            按钮
                        </Button>
                    ))}
                </Space>
            </TabPane>
            <TabPane tab="array" itemKey="4">
                <Space spacing={[8, 16]} wrap style={{ marginBlockStart: '15px' }}>
                    {tenButtons.map((item) => (
                        <Button key={item} theme="solid" type="primary">
                            按钮
                        </Button>
                    ))}
                </Space>
            </TabPane>
        </Tabs>
    );
}
