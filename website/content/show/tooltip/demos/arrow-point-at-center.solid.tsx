import { Button, Tooltip } from '@fibrae/semi-ui-solid';

export default function TooltipDemo() {
    return (
        <>
            <div>
                <Tooltip position="topLeft" content="semi design tooltip">
                    {(trigger) => (
                        <Button type="secondary" style={{ 'margin-right': '8px' }} {...trigger()}>
                            指向元素中心
                        </Button>
                    )}
                </Tooltip>
            </div>

            <div style={{ 'margin-top': '20px' }}>
                <Tooltip content="semi design tooltip" arrowPointAtCenter={false} position="topLeft">
                    {(trigger) => (
                        <Button type="secondary" style={{ 'margin-right': '8px', width: '120px' }} {...trigger()}>
                            边缘对齐
                        </Button>
                    )}
                </Tooltip>
            </div>
        </>
    );
}
