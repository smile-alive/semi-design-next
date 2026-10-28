import { For } from 'solid-js';
import { Button, Space } from '@fibrae/semi-ui-solid';

const fourButtons = [1, 2, 3, 4];

export default function SpaceDemo() {
    return (
        <Space vertical>
            <For each={fourButtons}>
                {() => (
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                )}
            </For>
        </Space>
    );
}
