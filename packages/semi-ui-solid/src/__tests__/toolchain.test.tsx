import { createSignal, DEV } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';

// Guards the solid vitest project: the root config compiles JSX for React and Vue, and Node would load solid-js's
// server build
describe('Solid test toolchain', () => {
    it('compiles JSX with the Solid compiler into the client runtime', () => {
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

    it('loads the development build, whose warnings the host relies on', () => {
        expect(DEV).toBeDefined();
    });
});
