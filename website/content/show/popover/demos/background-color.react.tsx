import { Popover, Tag } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    return (
        <div>
            <Popover
                aria-label="Colorful Popover"
                content={<article style={{ padding: 4 }}>Hi, Semi UI Popover.</article>}
                trigger="custom"
                visible
                position="right"
                showArrow
                style={{
                    backgroundColor: 'var(--semi-blue-6)',
                    borderColor: 'var(--semi-blue-6)',
                    color: 'var(--semi-color-white)',
                    borderWidth: 1,
                    borderStyle: 'solid',
                }}
            >
                <Tag
                    style={{
                        backgroundColor: 'var(--semi-blue-6)',
                        color: 'var(--semi-color-white)',
                    }}
                >
                    Colorful Popover
                </Tag>
            </Popover>
        </div>
    );
}
