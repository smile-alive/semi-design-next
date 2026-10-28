import { For } from 'solid-js';
import { Button, ButtonGroup } from '@fibrae/semi-ui-solid';

const sizes = ['large', 'default', 'small'] as const;

export default function ButtonDemo() {
    return (
        <div style={{ display: 'flex' }}>
            <For each={sizes}>
                {(size) => (
                    <div style={{ 'margin-right': '10px' }}>
                        <ButtonGroup size={size} aria-label="操作按钮组">
                            <Button>拷贝</Button>
                            <Button>查询</Button>
                            <Button>剪切</Button>
                        </ButtonGroup>
                    </div>
                )}
            </For>
        </div>
    );
}
