import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import ListDemo from './list-demo.svelte';

describe('List（浏览器）', () => {
    it('点击行内任意位置会点击该项，额外按钮除外', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const { container } = render(ListDemo, { props: { mode: 'rich', dataSource: ['Title'], itemProps: { onClick, style: 'height: 80px' } } });
        const item = container.querySelector('.semi-list-item') as HTMLElement;
        const rect = item.getBoundingClientRect();
        // A blank spot far from the title text still lands on the button, so a pointer there targets the control
        const x = rect.left + rect.width / 2;
        const y = rect.bottom - 4;
        expect(document.elementFromPoint(x, y)?.closest('button')).toBe(item.querySelector('.semi-list-item-button'));
        await userEvent.click(item, { position: { x: rect.width / 2, y: rect.height - 4 } });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');

        await userEvent.click(screen.getByRole('button', { name: '编辑' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
