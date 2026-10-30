import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import PopupFixture from './popup-fixture.svelte';

const prefix = 'semi-avatar';

describe('Svelte AvatarGroup 与弹层', () => {
    it('头像内容里弹层中的头像不继承组的 size、shape，也不是列表项', async () => {
        render(PopupFixture, { props: { kind: 'content' } });
        const inside = await screen.findByTestId('inside');
        expect(inside).toHaveClass(`${prefix}-medium`, `${prefix}-circle`);
        expect(inside).not.toHaveAttribute('role', 'listitem');
        expect(screen.getByRole('list').querySelectorAll(`.${prefix}-item-start-0`)).toHaveLength(1);
    });

    it('more 内容里弹层中的头像不是列表项，也不取 more 的样式', async () => {
        render(PopupFixture, { props: { kind: 'more' } });
        const inside = await screen.findByTestId('inside');
        expect(inside).not.toHaveAttribute('role', 'listitem');
        expect(inside).not.toHaveClass(`${prefix}-item-start-1`);
        expect(screen.getByText('+').closest(`.${prefix}`)).toHaveAttribute('role', 'listitem');
    });
});
