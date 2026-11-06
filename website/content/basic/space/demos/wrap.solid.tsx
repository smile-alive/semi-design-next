import { For } from 'solid-js';
import { Button, Space } from '@fibrae/semi-ui-solid';

const tenButtons = Array.from({ length: 10 }, (_, index) => index);

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
