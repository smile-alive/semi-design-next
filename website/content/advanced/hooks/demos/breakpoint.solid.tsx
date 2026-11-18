import { For } from 'solid-js';
import { Space, Tag } from '@fibrae/semi-ui-solid';
import { useBreakpoint } from '@fibrae/semi-ui-solid/primitives';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

export default function BreakpointDemo() {
    const screens = useBreakpoint();

    return (
        <Space>
            <For each={breakpoints}>{(breakpoint) => <Tag color={screens()[breakpoint] ? 'green' : 'grey'}>{breakpoint}</Tag>}</For>
        </Space>
    );
}
