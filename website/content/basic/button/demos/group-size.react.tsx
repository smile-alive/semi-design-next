import { ButtonGroup, Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    const sizes = ['large', 'default', 'small'] as const;

    return (
        <div style={{ display: 'flex' }}>
            {sizes.map((size) => (
                <div style={{ marginRight: 10 }} key={size}>
                    <ButtonGroup size={size} aria-label="操作按钮组">
                        <Button>拷贝</Button>
                        <Button>查询</Button>
                        <Button>剪切</Button>
                    </ButtonGroup>
                </div>
            ))}
        </div>
    );
}
