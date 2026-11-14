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

describe('Card classNames 与 styles', () => {
    it('按部位落到对应元素', () => {
        const parts = ['header', 'title', 'extra', 'cover', 'body', 'actions', 'footer'] as const;
        const selectors = { header: 'header', title: 'header-wrapper-title', extra: 'header-wrapper-extra', cover: 'cover', body: 'body', actions: 'body-actions', footer: 'footer' };
        const { container } = render(Card, {
            props: {
                title: 't',
                classNames: Object.fromEntries(parts.map((p) => [p, `my-${p}`])),
                styles: Object.fromEntries(parts.map((p) => [p, { order: parts.indexOf(p) + 1 }])),
            },
            slots: { default: () => 'body', headerExtraContent: () => 'e', cover: () => 'c', actions: () => 'a', footer: () => 'f' },
        });
        for (const part of parts) {
            const el = container.querySelector(`.semi-card-${selectors[part]}`);
            expect(el).toHaveClass(`my-${part}`);
            expect(el).toHaveStyle({ order: String(parts.indexOf(part) + 1) });
        }
    });
});
