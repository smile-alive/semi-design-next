import { For } from 'solid-js';
import { Button, ButtonGroup } from '@fibrae/semi-ui-solid';

const types = ['primary', 'secondary', 'tertiary', 'warning', 'danger'] as const;

export default function ButtonDemo() {
    return (
        <div style={{ display: 'flex' }}>
            <For each={types}>
                {(type) => (
                    <div style={{ 'margin-right': '10px' }}>
                        <ButtonGroup type={type} aria-label="操作按钮组">
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
