import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { type OnSortEnd, Sortable } from '..';

function List(props: { items?: (string | number)[]; onSortEnd: OnSortEnd }) {
    return (
        <Sortable
            dragHandleLabel={zh_CN.Transfer.dragSort}
            dragOverlayCls="overlay"
            items={props.items ?? ['a', 'b', 'c']}
            renderItem={(item) => {
                // the handle button zeroes its line height, so its content needs a height of its own to be pressed
                const Handle = item.sortableHandle(() => <span style={{ display: 'inline-block', height: '20px' }}>drag</span>);
                return (
                    <div style={{ height: '30px' }}>
                        <Handle />
                        <span>{item.id}</span>
                    </div>
                );
            }}
            onSortEnd={props.onSortEnd}
        />
    );
}

function renderSortable(onSortEnd: OnSortEnd, items?: (string | number)[]) {
    return render(() => <List items={items} onSortEnd={onSortEnd} />);
}

const getHandles = () => screen.getAllByRole('button', { name: zh_CN.Transfer.dragSort });
const status = () => document.querySelector('[id^="dnd-kit-announcement"]');
const itemTexts = () => [...document.querySelectorAll('.semi-sortable-sortable-item')].map((item) => item.textContent);

async function sortFirstDown() {
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
}

describe('Sortable（浏览器）', () => {
    it('可用键盘排序：Space 拾取已聚焦的手柄，Arrow 键移动，Space 放下', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        const handles = getHandles();
        expect(handles).toHaveLength(3);

        await userEvent.tab();
        expect(document.activeElement).toBe(handles[0]);
        await sortFirstDown();

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('id 为 0 的项也能被键盘排序', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd, [0, 1, 2]);

        await userEvent.tab();
        await sortFirstDown();

        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
    });

    it('手柄带语言包中的角色描述与键盘说明，拖拽过程按位置播报', async () => {
        renderSortable(vi.fn<OnSortEnd>());
        const [handle] = getHandles();
        expect(handle).toHaveAttribute('aria-roledescription', zh_CN.Sortable.roleDescription);
        await waitFor(() => expect(handle).toHaveAccessibleDescription(zh_CN.Sortable.instructions));

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.pickedUp.replace('${index}', '1').replace('${total}', '3')));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.movedTo.replace('${index}', '2')));
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.dropped.replace('${index}', '2')));
    });

    it('拖拽中浮层带 dragOverlayCls，排在列表容器之后（样式按兄弟关系找到拖拽中的项）', async () => {
        renderSortable(vi.fn<OnSortEnd>());
        expect(document.querySelector('[data-dnd-overlay]')).toBeNull();

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(document.querySelector('[data-dnd-overlay][data-dnd-dragging]')).toHaveClass('overlay'));
        const list = document.querySelector('.semi-sortable-sortable-item')?.parentElement;
        expect(list?.matches(':has(~ [data-dnd-overlay][data-dnd-dragging])')).toBe(true);
        await userEvent.keyboard('{Escape}');
    });

    it('Esc 取消拖拽时不触发 onSortEnd，并播报回到的位置', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);

        await userEvent.tab();
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.canceled.replace('${index}', '1')));
        expect(onSortEnd).not.toHaveBeenCalled();
        expect(itemTexts()).toEqual(['draga', 'dragb', 'dragc']);
    });

    it('指针拖动到另一项上后按新位置触发 onSortEnd', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);
        // forced: the items reorder under the pointer while the drag is in progress
        await userEvent.dragAndDrop(getHandles()[0], screen.getByText('c'), { force: true });
        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 2 }));
    });

    it('父组件接受排序后按新顺序渲染，手柄保留键盘焦点', async () => {
        const [items, setItems] = createSignal(['a', 'b', 'c']);
        render(() => (
            <List
                items={items()}
                onSortEnd={({ oldIndex, newIndex }) => {
                    const next = [...items()];
                    next.splice(newIndex, 0, ...next.splice(oldIndex, 1));
                    setItems(next);
                }}
            />
        ));
        const [handleA] = getHandles();

        await userEvent.tab();
        await sortFirstDown();

        await waitFor(() => expect(itemTexts()).toEqual(['dragb', 'draga', 'dragc']));
        expect(getHandles()[1]).toBe(handleA);
        await waitFor(() => expect(handleA).toHaveFocus());
    });

    it('父组件不接受排序时恢复原顺序，下一次拖拽仍按原位置计算', async () => {
        const onSortEnd = vi.fn<OnSortEnd>();
        renderSortable(onSortEnd);

        await userEvent.tab();
        await sortFirstDown();
        await waitFor(() => expect(onSortEnd).toHaveBeenCalledWith({ oldIndex: 0, newIndex: 1 }));
        await waitFor(() => expect(itemTexts()).toEqual(['draga', 'dragb', 'dragc']));

        // a drag started during the drop animation does not move
        await waitFor(() => expect(document.querySelector('[data-dnd-overlay]')).toBeNull());
        getHandles()[0].focus();
        await userEvent.keyboard(' ');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.pickedUp.replace('${index}', '1').replace('${total}', '3')));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(status()).toHaveTextContent(zh_CN.Sortable.movedTo.replace('${index}', '2')));
        await userEvent.keyboard(' ');
        await waitFor(() => expect(onSortEnd).toHaveBeenCalledTimes(2));
        expect(onSortEnd).toHaveBeenLastCalledWith({ oldIndex: 0, newIndex: 1 });
    });
});
