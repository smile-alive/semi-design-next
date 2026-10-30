import { flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { AvatarGroupProps } from '../interface';
import GroupFixture from './group-fixture.svelte';

const prefix = 'semi-avatar';
const avatars = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefix}`)];

type Store = AvatarGroupProps & { custom?: boolean; explicitMoreSize?: string; values?: string[] };

function setup(props: Store = {}) {
    const store = createStore<Store>(props);
    const view = render(GroupFixture, { props: { store } });
    return { store, container: view.container };
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte AvatarGroup', () => {
    it('默认中号圆形，组覆盖每个头像的配置并保留 class', () => {
        const { container } = setup();
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
        avatars(container).forEach((avatar, index) => expect(avatar).toHaveClass('own', `${prefix}-medium`, `${prefix}-circle`, `${prefix}-item-start-${index}`));
    });

    it('更新 size、shape、overlapFrom 时所有子项同步', () => {
        const { store, container } = setup();
        store.size = 'small';
        store.shape = 'square';
        store.overlapFrom = 'end';
        flushSync();
        avatars(container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${prefix}-small`, `${prefix}-square`, `${prefix}-item-end-${index}`);
            expect(avatar).not.toHaveClass(`${prefix}-item-start-${index}`);
        });
    });

    it('maxCount 显示 +N，名称包含剩余数量与被隐藏头像的 alt 并跟随数量变化', () => {
        const { store, container } = setup({ maxCount: 3 });
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
        const more = avatars(container)[3];
        expect(more).toHaveClass(`${prefix}-item-more`, `${prefix}-item-start-3`);
        expect(screen.getByRole('img', { name: '另有 2 个头像: ZL,YZ' })).toHaveTextContent('+2');
        const first = avatars(container)[0];
        store.maxCount = 1;
        flushSync();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByRole('img', { name: '另有 4 个头像: CX,RM,ZL,YZ' })).toHaveTextContent('+4');
        expect(avatars(container)[0]).toBe(first);
    });

    it('未超过 maxCount 时显示全部，空组和单个子项可用', () => {
        const { store, container } = setup({ maxCount: 5 });
        expect(avatars(container)).toHaveLength(5);
        expect(container.querySelector(`.${prefix}-item-more`)).toBeNull();
        store.values = ['A'];
        flushSync();
        expect(avatars(container)).toHaveLength(1);
        store.values = [];
        flushSync();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
        expect(screen.getByRole('list').textContent?.trim()).toBe('');
    });

    it('移除头像后 maxCount 按剩余数量计', () => {
        const { store, container } = setup({ maxCount: 2 });
        store.values = ['CX', 'RM', 'ZL'];
        flushSync();
        expect(avatars(container)).toHaveLength(3);
        expect(screen.getByRole('list')).toHaveTextContent('+1');
    });

    it('more snippet 取得剩余数量和被隐藏的完整数据项', () => {
        const { container } = setup({ maxCount: 1, values: ['A', 'B', 'C'], custom: true });
        expect(screen.getByRole('list')).toHaveTextContent('+2');
        expect(avatars(container)).toHaveLength(2);
        expect(container.querySelector('[data-rest]')).toHaveAttribute('data-rest', 'B,C');
    });

    it('item snippet 取得数据项与下标，作为头像内容', () => {
        const { container } = setup({ maxCount: 2, values: ['A', 'B', 'C'] });
        expect(avatars(container).map((avatar) => avatar.textContent?.trim())).toEqual(['A0', 'B1', '+1']);
    });

    it('items 的每一项是 Avatar 的属性，换掉 items 后列表同步', () => {
        const { store, container } = setup({ items: [{ src: 'https://example.com/a.png', alt: 'a' }, { alt: 'b' }] });
        expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
        store.items = [{ alt: 'c' }];
        flushSync();
        expect(avatars(container)).toHaveLength(1);
        expect(container.querySelector('img')).toBeNull();
    });

    it('包裹的 more 头像继承列表语义、尺寸、形状、重叠类，显式 size 优先', () => {
        const { store, container } = setup({ maxCount: 2, custom: true, size: 'small', shape: 'square', overlapFrom: 'end' });
        const more = () => avatars(container)[2];
        expect(screen.getAllByRole('listitem')).toHaveLength(3);
        expect(more()).toHaveClass(`${prefix}-small`, `${prefix}-square`, `${prefix}-item-end-2`);
        store.explicitMoreSize = 'large';
        flushSync();
        expect(more()).toHaveClass(`${prefix}-large`);
        expect(more()).not.toHaveClass(`${prefix}-small`);
    });

    it('属性只落在组根元素', () => {
        const { container } = setup({ id: 'team', class: 'mine', 'aria-label': 'team', 'data-team': 'yes', style: 'margin: 4px' });
        const list = screen.getByRole('list', { name: 'team' });
        expect(list).toHaveAttribute('id', 'team');
        expect(list).toHaveAttribute('data-team', 'yes');
        expect(list).toHaveClass('mine');
        expect(list).toHaveStyle({ margin: '4px' });
        avatars(container).forEach((avatar) => {
            expect(avatar).not.toHaveAttribute('id');
            expect(avatar).not.toHaveClass('mine');
        });
    });

    it('从全局默认值读取 shape 与 overlapFrom，显式配置优先', () => {
        semiGlobal.config = { overrideDefaultProps: { AvatarGroup: { shape: 'square', overlapFrom: 'end' } } };
        const { store, container } = setup();
        expect(avatars(container)[0]).toHaveClass(`${prefix}-square`, `${prefix}-item-end-0`);
        store.shape = 'circle';
        flushSync();
        expect(avatars(container)[0]).toHaveClass(`${prefix}-circle`);
    });
});
