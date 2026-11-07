import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Sortable, type OnSortEnd } from '../index';

function renderSortable(onSortEnd: OnSortEnd, items: Array<string | number> = ['a', 'b', 'c']) {
    return render(
        <Sortable
            dragHandleLabel={zh_CN.Transfer.dragSort}
            items={items}
            renderItem={({ id, sortableHandle }) => {
                // the handle button zeroes its line height, so its content needs a height of its own to be pressed
                const Handle = sortableHandle(() => <span style={{ display: 'inline-block', height: 20 }}>drag</span>);
                return (
                    <div style={{ height: 30 }}>
                        <Handle />
                        <span>{id}</span>
                    </div>
                );
            }}
            onSortEnd={onSortEnd}
        />
    );
}

describe('Sortable（浏览器）', () => {
    it('可用键盘排序：Space 拾取已聚焦的手柄，Arrow 键移动，Space 放下', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handles).toHaveLength(3);

        await userEvent.tab();
        expect(document.activeElement).toBe(handles[0]);
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('id 为 0 的项也能被键盘排序', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd, [0, 1, 2]);

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard(' ');

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('手柄带语言包中的角色描述与键盘说明，拖拽过程按位置播报', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        const [handle] = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        expect(handle).toHaveAttribute('aria-roledescription', zh_CN.Sortable.roleDescription);
        await waitFor(() => expect(handle).toHaveAccessibleDescription(zh_CN.Sortable.instructions));
        const status = () => document.querySelector('[id^="dnd-kit-announcement"]');

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.pickedUp.replace('${index}', '1').replace('${total}', '3')));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.movedTo.replace('${index}', '2')));
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.dropped.replace('${index}', '2')));
    });

    it('Esc 取消拖拽时不触发 onSortEnd，并播报回到的位置', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        const status = () => document.querySelector('[id^="dnd-kit-announcement"]');

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.canceled.replace('${index}', '1')));
        expect(onSortEnd).not.toHaveBeenCalled();
        expect([...document.querySelectorAll('.semi-sortable-sortable-item')].map((item) => item.textContent)).toEqual(['draga', 'dragb', 'dragc']);
    });

    it('指针拖动到另一项上后按新位置触发 onSortEnd', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        const handles = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
        await userEvent.dragAndDrop(handles[0], screen.getByText('c'), { force: true });
        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 2 }));
    });

    it('重新渲染时保留同一个手柄元素，使键盘焦点在拖拽后仍然保留', async () => {
        const { rerender } = renderSortable(vi.fn());
        const handle = screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort })[0];
        rerender(
            <Sortable
                dragHandleLabel={zh_CN.Transfer.dragSort}
                items={['a', 'b', 'c']}
                renderItem={({ id, sortableHandle }) => {
                    const Handle = sortableHandle(() => <span>drag</span>);
                    return (
                        <div style={{ height: 30 }}>
                            <Handle />
                            <span>{id}</span>
                        </div>
                    );
                }}
                onSortEnd={vi.fn<OnSortEnd>()}
            />
        );
        expect(screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort })[0]).toBe(handle);
    });
});
