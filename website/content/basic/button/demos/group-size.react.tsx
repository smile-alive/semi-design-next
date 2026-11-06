import { ButtonGroup, Button } from '@fibrae/semi-ui-react';

const sizes = ['large', 'default', 'small'] as const;

export default function ButtonDemo() {
    return (
        <div style={{ display: 'flex' }}>
            {sizes.map((size) => (
                <div style={{ marginInlineEnd: 10 }} key={size}>
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
