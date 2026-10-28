import { Button, Popconfirm, Tooltip } from '@fibrae/semi-ui-solid';

export default function TooltipDemo() {
    return (
        <Popconfirm content="是否确认删除" title="确认" style={{ width: '320px' }}>
            {(popconfirmTrigger) => (
                <span style={{ display: 'inline-block' }} {...popconfirmTrigger({ tabIndex: -1 })}>
                    <Tooltip content="删除评价">
                        {(tooltipTrigger) => (
                            <Button type="danger" {...tooltipTrigger()}>
                                删除
                            </Button>
                        )}
                    </Tooltip>
                </span>
            )}
        </Popconfirm>
    );
}
