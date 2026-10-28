import { ButtonGroup, Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;

    return (
        <div style={{ display: 'flex' }}>
            {types.map((type) => (
                <div style={{ marginRight: 10 }} key={type}>
                    <ButtonGroup type={type} aria-label="操作按钮组">
                        <Button>拷贝</Button>
                        <Button>查询</Button>
                        <Button>剪切</Button>
                    </ButtonGroup>
                </div>
            ))}
        </div>
    );
}
