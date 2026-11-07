/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import List, { ListItem } from '..';
import Button from '../../button';

describe('list', () => {
    it('点击行内任意位置会点击该项，额外按钮除外', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onExtra = vi.fn<() => void>();
        const { container } = render(List, {
            slots: {
                default: () => (
                    <ListItem style={{ height: '80px' }} onClick={onClick}>
                        {{
                            main: () => 'Title',
                            extra: () => <Button onClick={onExtra}>{() => 'Act'}</Button>,
                        }}
                    </ListItem>
                ),
            },
        });
        const item = container.querySelector('.semi-list-item') as HTMLElement;
        const rect = item.getBoundingClientRect();
        // A blank spot far from the title text still lands on the button, so a pointer there targets the control
        const x = rect.left + rect.width / 2;
        const y = rect.bottom - 4;
        expect(document.elementFromPoint(x, y)?.closest('button')).toBe(screen.getByRole('button', { name: 'Title' }));
        await userEvent.click(item, { position: { x: rect.width / 2, y: rect.height - 4 } });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');

        await userEvent.click(screen.getByRole('button', { name: 'Act' }));
        expect(onExtra).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
