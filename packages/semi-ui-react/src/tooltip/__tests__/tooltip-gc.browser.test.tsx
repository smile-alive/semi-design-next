import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Select, Tooltip } from '@fibrae/semi-ui-react';

declare const gc: () => void;

const frames = async (count: number) => {
    for (let i = 0; i < count; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
};

describe('Tooltip around a Select', () => {
    it('exposes gc', () => {
        expect(typeof gc).toBe('function');
    });

    it('does not keep closed dropdown roots alive', async () => {
        render(
            <Tooltip content="tip">
                <Select motion={false} optionList={[{ value: 'a', label: 'A' }]} />
            </Tooltip>
        );
        const trigger = screen.getByRole('combobox');
        const roots: WeakRef<Element>[] = [];
        for (let i = 0; i < 10; i++) {
            await userEvent.click(trigger);
            const listbox = await screen.findByRole('listbox');
            const root = listbox.closest('[popover]');
            expect(root).not.toBeNull();
            roots.push(new WeakRef(root as Element));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        }
        await frames(5);
        gc();
        await frames(5);
        gc();
        const alive = roots.filter((ref) => ref.deref()).length;
        expect(alive).toBeLessThanOrEqual(1);
    });
});
