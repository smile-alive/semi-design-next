import { flushSync } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import type { SplitTagGroupProps, TagCloseEvent, TagGroupItem, TagGroupProps } from '../interface';
import GroupFixture from './group-fixture.svelte';
import SplitFixture from './split-fixture.svelte';

const prefix = 'semi-tag';

function setupGroup(props: TagGroupProps, custom = false) {
    const store = createStore<{ props: TagGroupProps; custom?: boolean }>({ props, custom });
    const view = render(GroupFixture, { props: { store } });
    return { store, container: view.container, tags: () => [...view.container.querySelectorAll<HTMLElement>(`.${prefix}`)] };
}

describe('Svelte TagGroup', () => {
    it('相同文字标签关闭后不影响第二个，并通知 onTagClose', async () => {
        const close = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const { container, tags } = setupGroup({
            tagList: [
                { children: '待办', closable: true },
                { children: '待办', closable: true },
            ],
            onTagClose: close,
        });
        await fireEvent.click(container.querySelector(`.${prefix}-close`) as HTMLElement);
        flushSync();
        expect(tags()[0]).toHaveClass(`${prefix}-invisible`);
        expect(tags()[1]).not.toHaveClass(`${prefix}-invisible`);
        expect(close).toHaveBeenCalledWith(expect.any(MouseEvent), '待办');
    });

    it('数据项自己的 onClose 与组的 onTagClose 都会触发', async () => {
        const own = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const group = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const { container } = setupGroup({ tagList: [{ children: 'a', closable: true, tagKey: 'k', onClose: own }], onTagClose: group });
        await fireEvent.click(container.querySelector(`.${prefix}-close`) as HTMLElement);
        expect(own).toHaveBeenCalledWith(expect.any(MouseEvent), 'k');
        expect(group).toHaveBeenCalledWith(expect.any(MouseEvent), 'k');
    });

    it('没有 tagKey 时移除已关闭的标签，后一个标签不继承其隐藏状态', async () => {
        const tagList = ['A', 'B', 'C'].map((children) => ({ children, closable: true }));
        const { store, container, tags } = setupGroup({ tagList });
        await fireEvent.click(container.querySelectorAll(`.${prefix}-close`)[1] as HTMLElement);
        flushSync();
        store.props.tagList = tagList.filter((tag) => tag.children !== 'B');
        flushSync();
        expect(tags().map((tag) => tag.textContent?.trim())).toEqual(['A', 'C']);
        tags().forEach((tag) => expect(tag).not.toHaveClass(`${prefix}-invisible`));
    });

    it('无 key 的标签跨引用变化保持挂载', () => {
        const tagList = [{ children: 'a' }, { children: 'b' }];
        const { store, tags } = setupGroup({ tagList });
        const before = tags();
        store.props.tagList = [...tagList];
        flushSync();
        expect(tags()).toEqual(before);
    });

    it('不会修改共享 tagList，组级样式各自生效', () => {
        const tagList: TagGroupItem[] = [{ children: 'a', color: 'white', avatarSrc: 'avatar.png' }, { children: 'b' }];
        const snapshot = tagList.map((tag) => ({ ...tag }));
        setupGroup({ tagList, size: 'small' });
        const large = setupGroup({ tagList, size: 'large', avatarShape: 'circle' });
        expect(tagList).toEqual(snapshot);
        expect(large.tags()[0]).toHaveClass(`${prefix}-large`, `${prefix}-avatar-circle`);
    });

    it('数据项的尺寸优先于组的尺寸', () => {
        const { tags } = setupGroup({ tagList: [{ children: 'a', size: 'small' }, { children: 'b' }], size: 'large' });
        expect(tags()[0]).toHaveClass(`${prefix}-small`);
        expect(tags()[1]).toHaveClass(`${prefix}-large`);
    });

    it('最大数量与 restCount 控制 +N，通知鼠标进入', async () => {
        const enter = vi.fn<(event: MouseEvent) => void>();
        setupGroup({ tagList: [{ children: 'a' }, { children: 'b' }], maxTagCount: 1, restCount: 5, onPlusNMouseEnter: enter });
        expect(screen.queryByText('b')).toBeNull();
        await fireEvent.mouseEnter(screen.getByText('+5').closest(`.${prefix}`) as HTMLElement);
        expect(enter).toHaveBeenCalledTimes(1);
    });

    it('maxTagCount 不小于数量时不显示 +N，组带上 max 与尺寸类名', () => {
        const { container } = setupGroup({ tagList: [{ children: 'a' }, { children: 'b' }], maxTagCount: 2, size: 'small', class: 'own' });
        expect(screen.queryByText(/^\+/)).toBeNull();
        expect(container.querySelector(`.${prefix}-group`)).toHaveClass(`${prefix}-group-max`, `${prefix}-group-small`, 'own');
    });

    it('tag snippet 接收原始数据与下标，直接渲染自定义标签', () => {
        const { container } = setupGroup({ tagList: [{ children: 'a' }, { children: 'b' }] }, true);
        expect(container.querySelectorAll('strong')).toHaveLength(2);
        expect(screen.getByText('1:b')).toBeInTheDocument();
        expect(container.querySelector(`.${prefix}`)).toBeNull();
    });
});

describe('Svelte SplitTagGroup', () => {
    const setupSplit = (count = 2, extra: { nested?: boolean; props?: SplitTagGroupProps } = {}) => {
        const store = createStore<{ count: number; nested?: boolean; props?: SplitTagGroupProps }>({ count, ...extra });
        const view = render(SplitFixture, { props: { store } });
        return { store, group: screen.getByRole('group'), container: view.container };
    };

    it('保留默认内容、子元素样式与原生属性', () => {
        const { group } = setupSplit(2, { props: { class: 'custom', 'aria-label': '标签组', style: 'margin-top: 10px' } });
        expect(screen.getByRole('group', { name: '标签组' })).toHaveClass(`${prefix}-split`, 'custom');
        expect(group).toHaveStyle({ marginTop: '10px' });
        expect(group.children).toHaveLength(2);
    });

    it('支持单个标签', () => {
        const { group } = setupSplit(1);
        expect(group.children).toHaveLength(1);
        expect(group).toHaveTextContent('1');
    });

    it('支持三个标签并保持顺序', () => {
        const { group } = setupSplit(3);
        expect([...group.children].map((child) => child.textContent?.trim())).toEqual(['1', '2', '3']);
    });

    it('嵌套标签保留在父标签内', () => {
        const { group } = setupSplit(2, { nested: true });
        expect(group.children).toHaveLength(2);
        expect(group.children[0]).toHaveTextContent('1 nested');
    });

    it('子元素变化时同步渲染并保持已有节点', () => {
        const { store, group } = setupSplit(2);
        const first = group.firstElementChild;
        store.count = 3;
        flushSync();
        expect(group.children).toHaveLength(3);
        expect(group.firstElementChild).toBe(first);
        expect(group.lastElementChild).toHaveTextContent('3');
    });
});
