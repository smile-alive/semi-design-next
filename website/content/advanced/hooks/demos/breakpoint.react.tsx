import { Space, Tag } from '@fibrae/semi-ui-react';
import { useBreakpoint } from '@fibrae/semi-ui-react/hooks';

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

export default function BreakpointDemo() {
    const screens = useBreakpoint();

    return (
        <Space>
            {breakpoints.map((breakpoint) => (
                <Tag key={breakpoint} color={screens[breakpoint] ? 'green' : 'grey'}>
                    {breakpoint}
                </Tag>
            ))}
        </Space>
    );
}
