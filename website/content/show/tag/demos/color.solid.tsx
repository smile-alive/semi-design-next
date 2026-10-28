import { For } from 'solid-js';
import { Space, Tag, type TagColor } from '@fibrae/semi-ui-solid';

const colors: TagColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow', 'white'];

export default function TagDemo() {
    return (
        <Space wrap>
            <For each={colors}>{(color) => <Tag color={color}>{color}</Tag>}</For>
        </Space>
    );
}
