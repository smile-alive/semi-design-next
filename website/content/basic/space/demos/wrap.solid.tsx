import { For } from 'solid-js';
import { Button, Space } from '@fibrae/semi-ui-solid';

const tenButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SpaceDemo() {
    return (
        <Space wrap>
            <For each={tenButtons}>
                {() => (
                    <Button theme="solid" type="secondary">
                        按钮
                    </Button>
                )}
            </For>
        </Space>
    );
}
