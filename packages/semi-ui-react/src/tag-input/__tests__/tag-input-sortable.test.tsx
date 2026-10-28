import type { FocusEvent } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import TagInput from '..';
import type { SortableProps } from '../../_sortable';

// The sortable list loads lazily; this stand-in waits for the test to release it, and shows its ids and a sort end
const gate = vi.hoisted(() => Promise.withResolvers<void>());
vi.mock('../../_sortable', async () => {
    await gate.promise;
    const handleCls = `${BASE_CLASS_PREFIX}-tagInput-sortable-handle`;
    const StubHandle = () => <button type="button" className={handleCls} aria-label="drag" />;
    const Sortable = ({ items, renderItem, container: Container, onSortEnd }: SortableProps) => (
        <>
            <Container>
                {items.map((id) => (
                    <div key={id} className="item" data-id={id}>
                        {renderItem({ id, sortableHandle: () => StubHandle })}
                    </div>
                ))}
            </Container>
            <button type="button" onClick={() => onSortEnd({ oldIndex: 0, newIndex: 2 })}>
                sort-end
            </button>
        </>
    );
    return { Sortable };
});

const tagCls = `${BASE_CLASS_PREFIX}-tagInput`;
const getRoot = () => document.querySelector(`.${tagCls}`) as HTMLElement;
const tagButton = (value: string) => screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', value) });
const items = () => [...document.querySelectorAll<HTMLElement>(`.${tagCls}-sortable-list .item`)];

describe('TagInput 可排序列表', () => {
    it('可排序列表加载前聚焦的标签，加载后焦点落在新列表的同一标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<(event: FocusEvent<HTMLDivElement>) => void>();
        render(<TagInput defaultValue={['a', 'b', 'c']} draggable onBlur={onBlur} />);
        act(() => tagButton('b').focus());
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
        expect(tagButton('b')).toHaveFocus();
        await act(async () => gate.resolve());
        await waitFor(() => expect(items()).toHaveLength(3));
        expect(items()[1]).toContainElement(tagButton('b'));
        expect(tagButton('b')).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('可排序列表已加载时从外部聚焦标签，切换后焦点仍在该标签上', async () => {
        gate.resolve();
        render(
            <>
                <TagInput defaultValue={['a', 'b', 'c']} draggable />
                <button type="button">after</button>
            </>
        );
        act(() => tagButton('c').focus());
        await waitFor(() => expect(items()).toHaveLength(3));
        act(() => screen.getByRole('button', { name: 'after' }).focus());
        expect(items()).toHaveLength(0);
        act(() => tagButton('c').focus());
        expect(items()).toHaveLength(3);
        expect(items()[2]).toContainElement(tagButton('c'));
        expect(tagButton('c')).toHaveFocus();
    });

    it('重复标签排序后被拖动的项保留自己的 id 与节点', async () => {
        gate.resolve();
        render(<TagInput defaultValue={['a', 'b', 'a']} draggable />);
        fireEvent.click(getRoot());
        await waitFor(() => expect(items()).toHaveLength(3));
        const [first] = items();
        const firstId = first.dataset.id;
        fireEvent.click(screen.getByRole('button', { name: 'sort-end' }));
        expect(items().map((item) => item.textContent)).toEqual(['b', 'a', 'a']);
        expect(items()[2].dataset.id).toBe(firstId);
        expect(items()[2]).toBe(first);
    });
});
