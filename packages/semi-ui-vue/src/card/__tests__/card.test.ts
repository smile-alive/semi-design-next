import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Card from '..';

describe('Card role', () => {
    it('被命名时根元素为 group，使用方的 role 优先，未命名时没有 role', () => {
        const named = render(Card, { attrs: { 'aria-label': 'profile' }, slots: { default: () => 'body' } });
        expect(named.container.firstElementChild).toHaveAttribute('role', 'group');
        named.unmount();

        const own = render(Card, { attrs: { 'aria-label': 'profile', role: 'region' }, slots: { default: () => 'body' } });
        expect(own.container.firstElementChild).toHaveAttribute('role', 'region');
        own.unmount();

        const bare = render(Card, { slots: { default: () => 'body' } });
        expect(bare.container.firstElementChild).not.toHaveAttribute('role');
    });
});
