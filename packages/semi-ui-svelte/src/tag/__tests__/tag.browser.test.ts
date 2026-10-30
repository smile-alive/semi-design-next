import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { TagCloseEvent, TagGroupProps, TagProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import SplitFixture from './split-fixture.svelte';
import TagsFixture from './tags-fixture.svelte';

type Item = { label: string; props?: TagProps };

const closable = (labels: string[]): Item[] => labels.map((label) => ({ label, props: { closable: true } }));

function setup(items: Item[], target?: HTMLElement) {
    const view = render(TagsFixture, { props: { items }, ...(target ? { target } : {}) });
    const root: ParentNode = target?.getRootNode() instanceof ShadowRoot ? (target.getRootNode() as ShadowRoot) : view.container;
    return { tags: [...root.querySelectorAll<HTMLElement>('.semi-tag')], unmount: view.unmount };
}

describe('Svelte Tag（浏览器）', () => {
    it.each(['Backspace', 'Delete'])('%s 关闭标签后，焦点移到后一个标签', async (key) => {
        const { tags } = setup(closable(['甲', '乙']));
        tags[0].focus();
        await userEvent.keyboard(`{${key}}`);
        flushSync();
        expect(tags[0]).toHaveClass('semi-tag-invisible');
        expect(tags[1]).toHaveFocus();
    });

    it('ShadowRoot 内 Backspace 关闭标签后，焦点移到后一个标签', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const mount = document.createElement('div');
        shadow.append(mount);
        const { tags, unmount } = setup(closable(['甲', '乙']), mount);
        try {
            tags[0].focus();
            await userEvent.keyboard('{Backspace}');
            flushSync();
            expect(tags[0]).toHaveClass('semi-tag-invisible');
            expect(shadow.activeElement).toBe(tags[1]);
        } finally {
            unmount();
            host.remove();
        }
    });

    it('Backspace 关闭最后一个标签后，焦点移到前一个标签', async () => {
        const { tags } = setup(closable(['甲', '乙']));
        tags[1].focus();
        await userEvent.keyboard('{Backspace}');
        flushSync();
        expect(tags[1]).toHaveClass('semi-tag-invisible');
        expect(tags[0]).toHaveFocus();
    });

    it('点击关闭图标后，焦点留在原位置之外的相邻标签上', async () => {
        const { tags } = setup(closable(['甲', '乙']));
        tags[0].focus();
        await userEvent.click(tags[0].querySelector('.semi-tag-close') as HTMLElement);
        flushSync();
        expect(tags[0]).toHaveClass('semi-tag-invisible');
        expect(tags[1]).toHaveFocus();
    });

    it('onClose 中 preventDefault 时焦点留在原标签', async () => {
        const items = closable(['甲', '乙']);
        items[0].props = { closable: true, onClose: (event) => event.preventDefault() };
        const { tags } = setup(items);
        tags[0].focus();
        await userEvent.keyboard('{Backspace}');
        flushSync();
        expect(tags[0]).not.toHaveClass('semi-tag-invisible');
        expect(tags[0]).toHaveFocus();
    });

    it('键盘激活后 Tab 跳过静态标签并关闭可关闭标签，显示主题焦点环', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const { tags } = setup([{ label: '李白', props: { onclick: click } }, { label: '白居易' }, { label: '杜甫', props: { closable: true } }]);
        await tabTo(tags[0]);
        expectThemeFocusRing(tags[0]);
        await userEvent.keyboard('{Enter}');
        expect(click).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Tab}');
        expect(tags[2]).toHaveFocus();
        expectThemeFocusRing(tags[2]);
        await userEvent.keyboard('{Backspace}');
        flushSync();
        expect(tags[2]).toHaveClass('semi-tag-invisible');
    });

    it('Space 激活可点击标签且不滚动页面', async () => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const { tags } = setup([{ label: '李白', props: { onclick: click } }]);
        tags[0].focus();
        await userEvent.keyboard(' ');
        expect(click).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button')).toHaveFocus();
    });
});

describe('Svelte TagGroup（浏览器）', () => {
    const popoverGroup = (props: Partial<TagGroupProps> = {}) => ({
        props: {
            maxTagCount: 3,
            showPopover: true,
            size: 'large' as const,
            popoverProps: { motion: false },
            tagList: ['抖音', '火山小视频', 'Abc', 'vigo', '皮皮虾'].map((children) => ({ children, color: 'white' as const })),
            ...props,
        } satisfies TagGroupProps,
    });

    it('最大数量之外的标签由 Popover 显示并在卸载后清理', async () => {
        const store = createStore(popoverGroup());
        const view = render(GroupFixture, { props: { store } });
        expect(screen.queryByText('vigo')).toBeNull();
        await userEvent.click(screen.getByText('+2'));
        await waitFor(() => expect(document.querySelector('.semi-tag-rest-group-popover')).toHaveTextContent('vigo 皮皮虾'));
        view.unmount();
        await waitFor(() => expect(document.querySelector('.semi-tag-rest-group-popover')).toBeNull());
    });

    it('弹层里的标签可以关闭并通知 onTagClose，+N 是触发器本身', async () => {
        const close = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const store = createStore(popoverGroup({ onTagClose: close, tagList: ['a', 'b', 'c'].map((children) => ({ children, closable: true })), maxTagCount: 1 }));
        render(GroupFixture, { props: { store } });
        const plus = screen.getByText('+2').closest('.semi-tag') as HTMLElement;
        expect(plus.parentElement).toHaveClass('semi-tag-group');
        await userEvent.click(plus);
        const popup = await waitFor(() => {
            const found = document.querySelector<HTMLElement>('.semi-tag-rest-group-popover');
            expect(found).not.toBeNull();
            return found as HTMLElement;
        });
        await userEvent.click(popup.querySelector('.semi-tag-close') as HTMLElement);
        expect(close).toHaveBeenCalledWith(expect.any(MouseEvent), 'b');
    });
});

describe('Svelte SplitTagGroup（浏览器）', () => {
    it.each(['square', 'circle'] as const)('%s 首尾圆角仅影响直接子元素，支持单个标签', (shape) => {
        const store = createStore<{ count: number; shape: 'square' | 'circle'; nested: boolean }>({ count: 3, shape, nested: true });
        const view = render(SplitFixture, { props: { store } });
        const tags = screen.getByRole('group').children;
        const radius = getComputedStyle(tags[0]).borderTopLeftRadius;
        expect(radius).not.toBe('0px');
        expect(getComputedStyle(tags[0]).borderTopRightRadius).toBe('0px');
        expect(getComputedStyle(tags[1]).borderRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopRightRadius).toBe(radius);
        expect(getComputedStyle(view.container.querySelector('.nested') as HTMLElement).borderTopLeftRadius).not.toBe('0px');
        store.count = 1;
        flushSync();
        const only = view.container.querySelector('.semi-tag') as HTMLElement;
        expect(getComputedStyle(only).borderTopLeftRadius).toBe(radius);
        expect(getComputedStyle(only).borderTopRightRadius).toBe(radius);
    });
});
