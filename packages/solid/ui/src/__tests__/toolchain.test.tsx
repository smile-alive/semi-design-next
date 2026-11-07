import { createSignal, DEV } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';

// Guards the solid vitest project: the root config compiles JSX for React and Vue, and Node would load solid-js's
// server build
describe('Solid test toolchain', () => {
    it('JSX 由 Solid 编译器编译到客户端运行时', () => {
        const [count, setCount] = createSignal(0);
        render(() => (
            <button type="button" onClick={() => setCount((value) => value + 1)}>
                {count()}
            </button>
        ));
        const button = screen.getByRole('button');
        button.click();
        expect(button).toHaveTextContent('1');
    });

    it('加载开发构建，宿主依赖其中的告警', () => {
        expect(DEV).toBeDefined();
    });
});
