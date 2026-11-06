import { Tooltip, Button } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    return (
        <>
            <div>
                <Tooltip position="topLeft" content="semi design tooltip">
                    <Button type="secondary" style={{ marginInlineEnd: 8 }}>
                        指向元素中心
                    </Button>
                </Tooltip>
            </div>

            <div style={{ marginBlockStart: 20 }}>
                <Tooltip content="semi design tooltip" arrowPointAtCenter={false} position="topLeft">
                    <Button type="secondary" style={{ marginInlineEnd: 8, width: 120 }}>
                        边缘对齐
                    </Button>
                </Tooltip>
            </div>
        </>
    );
}
