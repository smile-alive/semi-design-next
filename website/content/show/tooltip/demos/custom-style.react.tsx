import { Tooltip, Tag } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    return (
        <div>
            <Tooltip
                style={{
                    maxWidth: 320,
                }}
                className="another-classname"
                content="hi semi semi semi semi semi semi semi"
            >
                <Tag style={{ marginRight: '8px' }}>Custom Style And ClassName</Tag>
            </Tooltip>
        </div>
    );
}
