import { Button, ButtonGroup } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ 'margin-right': '10px' }}>
                <ButtonGroup disabled>
                    <Button>拷贝</Button>
                    <Button>查询</Button>
                    <Button>剪切</Button>
                </ButtonGroup>
            </div>
        </div>
    );
}
