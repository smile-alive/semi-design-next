import { ButtonGroup, Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ marginRight: 10 }}>
                <ButtonGroup disabled>
                    <Button>拷贝</Button>
                    <Button>查询</Button>
                    <Button>剪切</Button>
                </ButtonGroup>
            </div>
        </div>
    );
}
