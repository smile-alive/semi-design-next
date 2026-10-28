/** @jsxImportSource vue */
import { Comment, createTextVNode, h, type ComponentPublicInstance, type VNode } from 'vue';
import { within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import semiGlobal from '../../_utils/semi-global';
import AvatarGroup from '../avatar-group.vue';
import Avatar from '../avatar.vue';
import GroupPopover from './fixtures/group-popover.vue';
import Group from './fixtures/group.vue';

const prefix = 'semi-avatar';
type AvatarRefEvent = [value: string, instance: Element | ComponentPublicInstance | null];
const avatars = (container: Element) => [...container.querySelectorAll<HTMLElement>(`.${prefix}`)];
afterEach(() => {
    semiGlobal.config = {};
});

describe('AvatarGroup', () => {
    it('默认中号圆形，组覆盖每个头像的配置并保留 class', () => {
        const view = render(Group);
        expect(view.getAllByRole('listitem')).toHaveLength(5);
        avatars(view.container).forEach((avatar, index) => expect(avatar).toHaveClass('own', `${prefix}-medium`, `${prefix}-circle`, `${prefix}-item-start-${index}`));
    });

    it('组的尺寸只覆盖直接头像子项，不覆盖头像插槽内的嵌套头像', () => {
        const view = render(AvatarGroup, {
            props: { size: 'small' },
            slots: {
                default: () => (
                    <Avatar>
                        {{
                            default: () => <Avatar size="extra-large">{{ default: () => 'X' }}</Avatar>,
                        }}
                    </Avatar>
                ),
            },
        });
        const items = avatars(view.container);
        expect(items[0]).toHaveClass(`${prefix}-small`);
        expect(items[1]).toHaveClass(`${prefix}-extra-large`);
        expect(items[1]).not.toHaveClass(`${prefix}-small`);
    });

    it('更新 size、shape、overlapFrom 时所有子项同步', async () => {
        const view = render(Group);
        await view.rerender({ size: 'small', shape: 'square', overlapFrom: 'end' });
        avatars(view.container).forEach((avatar, index) => {
            expect(avatar).toHaveClass(`${prefix}-small`, `${prefix}-square`, `${prefix}-item-end-${index}`);
            expect(avatar).not.toHaveClass(`${prefix}-item-start-${index}`);
        });
    });

    it('maxCount 显示 +N，名称包含剩余数量与头像名称并跟随数量变化', async () => {
        const view = render(Group, { props: { maxCount: 3 } });
        expect(view.getAllByRole('listitem')).toHaveLength(4);
        const more = avatars(view.container)[3];
        expect(more).toHaveClass(`${prefix}-item-more`, `${prefix}-item-start-3`);
        expect(view.getByRole('img', { name: '另有 2 个头像: ZL,YZ' })).toHaveTextContent('+2');
        const first = avatars(view.container)[0];
        await view.rerender({ maxCount: 1 });
        expect(view.getAllByRole('listitem')).toHaveLength(2);
        expect(view.getByRole('img', { name: '另有 4 个头像: CX,RM,ZL,YZ' })).toHaveTextContent('+4');
        expect(avatars(view.container)[0]).toBe(first);
    });

    it('+N 的名称包含由多段文本组成的头像名称', () => {
        const view = render(AvatarGroup, {
            props: { maxCount: 1 },
            slots: {
                default: () => (
                    <>
                        <Avatar alt="A" />
                        <Avatar>{{ default: () => [createTextVNode('Z'), createTextVNode('L')] }}</Avatar>
                    </>
                ),
            },
        });
        expect(view.getByRole('img', { name: '另有 1 个头像: ZL' })).toHaveTextContent('+1');
    });

    it('未超过 maxCount 时显示全部，空组和单个子项可用', async () => {
        const view = render(Group, { props: { maxCount: 5 } });
        expect(avatars(view.container)).toHaveLength(5);
        expect(view.container.querySelector(`.${prefix}-item-more`)).toBeNull();
        await view.rerender({ values: ['A'] });
        expect(avatars(view.container)).toHaveLength(1);
        await view.rerender({ values: [] });
        expect(view.queryAllByRole('listitem')).toHaveLength(0);
        expect(view.getByRole('list').textContent).toBe('');
    });

    it('more slot 取得剩余数量和原始 vnode', () => {
        const more = vi.fn<(scope: { restNumber: number; restAvatars: unknown[] }) => VNode>(() => <span class="custom">more</span>);
        const view = render(AvatarGroup, {
            props: { maxCount: 1 },
            slots: {
                default: () => (
                    <>
                        <Avatar alt="A" />
                        <Avatar alt="B" />
                    </>
                ),
                more,
            },
        });
        expect(view.container.querySelector('.custom')).toHaveTextContent('more');
        expect(more.mock.calls[0][0].restNumber).toBe(1);
        expect(more.mock.calls[0][0].restAvatars).toHaveLength(1);
    });

    it('包裹的 more 头像继承列表语义、尺寸、形状、重叠类，显式 size 优先', async () => {
        const view = render(Group, {
            props: { maxCount: 2, custom: true, size: 'small', shape: 'square', overlapFrom: 'end' },
        });
        const more = () => avatars(view.container)[2];
        expect(view.getAllByRole('listitem')).toHaveLength(3);
        expect(more()).toHaveClass(`${prefix}-small`, `${prefix}-square`, `${prefix}-item-end-2`);
        await view.rerender({ explicitMoreSize: 'large' });
        expect(more()).toHaveClass(`${prefix}-large`);
        expect(more()).not.toHaveClass(`${prefix}-small`);
    });

    it('more 插槽里 Popover 弹层内的头像不是列表项，列表内的「+N」头像仍是', async () => {
        const view = render(GroupPopover);
        const popup = await view.findByTestId('popup');
        const popupAvatars = avatars(popup);
        expect(popupAvatars).toHaveLength(2);
        popupAvatars.forEach((avatar) => expect(avatar).not.toHaveAttribute('role'));
        const items = within(view.getByRole('list')).getAllByRole('listitem');
        expect(items).toHaveLength(3);
        expect(items[2]).toHaveTextContent('+2');
    });

    it('属性只落在组根元素', () => {
        const view = render(Group, {
            attrs: { id: 'team', class: 'mine', 'aria-label': 'team', 'data-team': 'yes', style: { margin: '4px' } },
        });
        const list = view.getByRole('list', { name: 'team' });
        expect(list).toHaveAttribute('id', 'team');
        expect(list).toHaveAttribute('data-team', 'yes');
        expect(list).toHaveClass('mine');
        expect(list).toHaveStyle({ margin: '4px' });
        avatars(view.container).forEach((avatar) => {
            expect(avatar).not.toHaveAttribute('id');
            expect(avatar).not.toHaveClass('mine');
            expect(avatar).not.toHaveStyle({ margin: '4px' });
        });
    });

    it('展开 Fragment，跳过注释，文本子项原样显示并计入 maxCount', () => {
        const view = render(AvatarGroup, {
            props: { maxCount: 1 },
            slots: {
                default: () => (
                    <>
                        {h(Comment)}
                        <>
                            <Avatar>{{ default: () => 'AB' }}</Avatar>
                            {createTextVNode('text')}
                            <Avatar>{{ default: () => 'CD' }}</Avatar>
                        </>
                    </>
                ),
            },
        });
        expect(avatars(view.container)).toHaveLength(2);
        expect(view.getByRole('list')).toHaveTextContent('+2');
        expect(view.getByRole('img', { name: '另有 2 个头像: CD' })).toBeInTheDocument();
    });

    it('文本独立子项不会抛错', () => {
        const view = render(AvatarGroup, { slots: { default: () => 'plain text' } });
        expect(view.getByRole('list')).toHaveTextContent('plain text');
    });

    it('普通元素子项保留原来的属性覆盖而不增加 DOM 包装', () => {
        const view = render(AvatarGroup, {
            props: { size: 'small', shape: 'square' },
            slots: {
                default: () => (
                    <span class="own" id="plain">
                        plain text
                    </span>
                ),
            },
        });
        const child = view.container.querySelector('#plain');
        expect(child).toHaveClass('own', `${prefix}-item-start-0`);
        expect(child).toHaveAttribute('size', 'small');
        expect(child).toHaveAttribute('shape', 'square');
        expect(view.getByRole('list').children).toHaveLength(1);
    });

    it('包装 Avatar 并透传 class 的组件只得到一份重叠 class', () => {
        const Wrapped = () => <Avatar>W</Avatar>;
        const view = render(AvatarGroup, { slots: { default: () => <Wrapped /> } });
        const overlap = `${prefix}-item-start-0`;
        expect(
            avatars(view.container)[0]
                .className.split(' ')
                .filter((name) => name === overlap)
        ).toHaveLength(1);
    });

    it('带 key 的头像前插入后保留 DOM 和组件 ref 身份', async () => {
        const view = render(Group, { props: { values: ['A'] } });
        const before = avatars(view.container)[0];
        const instance = view.emitted<AvatarRefEvent>('avatarRef').find(([value, reference]) => value === 'A' && reference)?.[1];
        expect(instance).toBeDefined();
        await view.rerender({ values: ['X', 'A'] });
        expect(avatars(view.container)[1]).toBe(before);
        expect(
            view
                .emitted<AvatarRefEvent>('avatarRef')
                .filter(([value, reference]) => value === 'A' && reference)
                .at(-1)?.[1]
        ).toBe(instance);
    });

    it('从全局默认值读取 shape 与 overlapFrom，显式配置优先', async () => {
        semiGlobal.config = { overrideDefaultProps: { AvatarGroup: { shape: 'square', overlapFrom: 'end' } } };
        const view = render(Group);
        expect(avatars(view.container)[0]).toHaveClass(`${prefix}-square`, `${prefix}-item-end-0`);
        await view.rerender({ shape: 'circle' });
        expect(avatars(view.container)[0]).toHaveClass(`${prefix}-circle`);
    });
});
