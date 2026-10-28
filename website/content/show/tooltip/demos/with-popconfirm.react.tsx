import { Tooltip, Popconfirm, Button } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    return (
        <Popconfirm content="是否确认删除" title="确认" style={{ width: 320 }}>
            <span style={{ display: 'inline-block' }}>
                <Tooltip content="删除评价">
                    <Button type="danger">删除</Button>
                </Tooltip>
            </span>
        </Popconfirm>
    );
}
