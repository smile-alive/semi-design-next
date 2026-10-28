import { Popover, Tag } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    return (
        <div>
            <Popover
                aria-label="Colorful Popover"
                content={<article style={{ padding: '4px' }}>Hi, Semi UI Popover.</article>}
                trigger="custom"
                visible
                position="right"
                showArrow
                style={{
                    'background-color': 'var(--semi-blue-6)',
                    'border-color': 'var(--semi-blue-6)',
                    color: 'var(--semi-color-white)',
                    'border-width': '1px',
                    'border-style': 'solid',
                }}
            >
                <Tag style={{ 'background-color': 'var(--semi-blue-6)', color: 'var(--semi-color-white)' }}>Colorful Popover</Tag>
            </Popover>
        </div>
    );
}
