import { For } from 'solid-js';
import { Button, Space, TabPane, Tabs } from '@fibrae/semi-ui-solid';

const fourButtons = [1, 2, 3, 4];
const tenButtons = Array.from({ length: 10 }, (_, index) => index);

export default function SpaceDemo() {
    return (
        <Tabs type="line">
            <TabPane tab="tight" itemKey="1">
                <Space spacing="tight" style={{ 'margin-block-start': '15px' }}>
                    <For each={fourButtons}>
                        {() => (
                            <Button theme="solid" type="primary">
                                按钮
                            </Button>
                        )}
                    </For>
                </Space>
            </TabPane>
            <TabPane tab="medium" itemKey="2">
                <Space spacing="medium" style={{ 'margin-block-start': '15px' }}>
                    <For each={fourButtons}>
                        {() => (
                            <Button theme="solid" type="primary">
                                按钮
                            </Button>
                        )}
                    </For>
                </Space>
            </TabPane>
            <TabPane tab="loose" itemKey="3">
                <Space spacing="loose" style={{ 'margin-block-start': '15px' }}>
                    <For each={fourButtons}>
                        {() => (
                            <Button theme="solid" type="primary">
                                按钮
                            </Button>
                        )}
                    </For>
                </Space>
            </TabPane>
            <TabPane tab="array" itemKey="4">
                <Space spacing={[8, 16]} wrap style={{ 'margin-block-start': '15px' }}>
                    <For each={tenButtons}>
                        {() => (
                            <Button theme="solid" type="primary">
                                按钮
                            </Button>
                        )}
                    </For>
                </Space>
            </TabPane>
        </Tabs>
    );
}
