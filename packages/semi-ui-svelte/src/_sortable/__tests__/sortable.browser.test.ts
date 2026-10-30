import { flushSync } from 'svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { mouse } from '@test/utils/browser';
import type { SortEndPayload } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import List from './list.svelte';

type SortEnd = (payload: SortEndPayload) => void;
const status = () => document.querySelector('[id^="dnd-kit-announcement"]');
const getHandles = () => screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
const overlay = () => document.querySelector('[data-dnd-overlay]');

describe('Svelte Sortable（浏览器）', () => {
    it('可用键盘排序：Space 拾取已聚焦的手柄，Arrow 键移动，Space 放下', async () => {
        const onSortEnd = vi.fn<SortEnd>();
        render(List, { props: { onSortEnd } });
        const handles = getHandles();
        expect(handles).toHaveLength(3);

        await userEvent.tab();
        await userEvent.tab();
        expect(document.activeElement).toBe(handles[0]);
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('id 为 0 的项也能被键盘排序', async () => {
        const onSortEnd = vi.fn<SortEnd>();
        render(List, { props: { items: [0, 1, 2], onSortEnd } });

        getHandles()[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('手柄带语言包中的角色描述与键盘说明，拖拽过程按位置播报', async () => {
        render(List);
        const [handle] = getHandles();
        expect(handle).toHaveAttribute('aria-roledescription', zh_CN.Sortable.roleDescription);
        await waitFor(() => expect(handle).toHaveAccessibleDescription(zh_CN.Sortable.instructions));

        handle.focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.pickedUp.replace('${index}', '1').replace('${total}', '3')));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.movedTo.replace('${index}', '2')));
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.dropped.replace('${index}', '2')));
    });

    it('Esc 取消拖拽时不触发 onSortEnd，并播报回到的位置', async () => {
        const onSortEnd = vi.fn<SortEnd>();
        render(List, { props: { onSortEnd } });

        getHandles()[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.canceled.replace('${index}', '1')));
        expect(onSortEnd).not.toHaveBeenCalled();
        expect([...document.querySelectorAll('.semi-sortable-sortable-item')].map((item) => item.textContent)).toEqual(['drag a', 'drag b', 'drag c']);
    });

    it('键盘拾取后，浮层渲染被拖项的内容', async () => {
        render(List);
        getHandles()[1].focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(overlay()).toHaveTextContent('drag b'));
        await userEvent.keyboard('{Escape}');
    });

    it('指针拖动过程中，浮层渲染被拖项的内容', async () => {
        render(List);
        const { left, top } = getHandles()[0].getBoundingClientRect();
        await mouse('move', left + 2, top + 2);
        await mouse('down', left + 2, top + 2);
        await mouse('move', left + 2, top + 40);
        // the button is real browser state, so it is released even when the assertion fails
        try {
            await waitFor(() => expect(overlay()).toHaveTextContent('drag a'));
        } finally {
            await mouse('up', left + 2, top + 40);
        }
    });

    it('指针拖动到另一项上后按新位置触发 onSortEnd', async () => {
        const onSortEnd = vi.fn<SortEnd>();
        render(List, { props: { onSortEnd } });
        // forced: the items reorder under the pointer while the drag is in progress
        await userEvent.dragAndDrop(getHandles()[0], screen.getByText('c'), { force: true });
        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 2 }));
    });

    it('父组件拒绝排序时列表回到原顺序', async () => {
        const onSortEnd = vi.fn<SortEnd>();
        render(List, { props: { onSortEnd } });

        getHandles()[0].focus();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledTimes(1));
        expect([...document.querySelectorAll('.semi-sortable-sortable-item [data-index] > span')].map((item) => item.textContent)).toEqual(['a', 'b', 'c']);
    });

    // Known limit: Svelte moves the reordered item's node, and a browser blurs a moved node that held focus
    it('父组件改 items 后保留同一个手柄元素', () => {
        const store = createStore({ items: ['a', 'b', 'c'] });
        render(List, { props: store });
        const handle = getHandles()[0];
        store.items = ['b', 'a', 'c'];
        flushSync();
        expect(getHandles()[1]).toBe(handle);
    });
});
