import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import TagInput, { type TagInputProps } from '..';
import type { SortableProps } from '../../_sortable/types';

// The sortable list loads lazily; this stand-in waits for the test to release it, and shows its ids and a sort end
const gate = vi.hoisted(() => Promise.withResolvers<void>());
vi.mock('../../_sortable', async () => {
    await gate.promise;
    const handleCls = `${BASE_CLASS_PREFIX}-tagInput-sortable-handle`;
    const StubHandle = () => <button type="button" class={handleCls} aria-label="drag" />;
    const Sortable = (props: SortableProps) => (
        <>
            <Dynamic component={props.container}>
                <For each={props.items}>
                    {(id) => (
                        <div class="item" data-id={id}>
                            {props.renderItem({ id, sortableHandle: () => StubHandle })}
                        </div>
                    )}
                </For>
            </Dynamic>
            <button type="button" onClick={() => props.onSortEnd({ oldIndex: 0, newIndex: 2 })}>
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
    it('可排序列表加载前代替它的标签列表同样显示全部标签，不折叠为 +N', () => {
        render(() => <TagInput defaultValue={['a', 'b', 'c']} draggable maxTagCount={1} expandRestTagsOnClick={false} />);
        fireEvent.click(getRoot());
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
        expect(document.querySelector(`.${tagCls}-wrapper-n`)).toBeNull();
        expect(['a', 'b', 'c'].map(tagButton)).toHaveLength(3);
    });

    it('可排序列表加载前聚焦的标签，加载后焦点落在新列表的同一标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<NonNullable<TagInputProps['onBlur']>>();
        render(() => <TagInput defaultValue={['a', 'b', 'c']} draggable onBlur={onBlur} />);
        tagButton('b').focus();
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
        expect(tagButton('b')).toHaveFocus();
        gate.resolve();
        await waitFor(() => expect(items()).toHaveLength(3));
        expect(items()[1]).toContainElement(tagButton('b'));
        expect(tagButton('b')).toHaveFocus();
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('可排序列表已加载时从外部聚焦标签，切换后焦点仍在该标签上', async () => {
        gate.resolve();
        render(() => (
            <>
                <TagInput defaultValue={['a', 'b', 'c']} draggable />
                <button type="button">after</button>
            </>
        ));
        tagButton('c').focus();
        await waitFor(() => expect(items()).toHaveLength(3));
        screen.getByRole('button', { name: 'after' }).focus();
        expect(items()).toHaveLength(0);
        tagButton('c').focus();
        await waitFor(() => expect(items()).toHaveLength(3));
        expect(items()[2]).toContainElement(tagButton('c'));
        expect(tagButton('c')).toHaveFocus();
    });

    it('重复标签排序后被拖动的项保留自己的 id 与节点', async () => {
        gate.resolve();
        render(() => <TagInput defaultValue={['a', 'b', 'a']} draggable />);
        fireEvent.click(getRoot());
        await waitFor(() => expect(items()).toHaveLength(3));
        const [first] = items();
        const firstId = first.dataset.id;
        fireEvent.click(screen.getByRole('button', { name: 'sort-end' }));
        expect(items().map((item) => item.textContent)).toEqual(['b', 'a', 'a']);
        expect(items()[2].dataset.id).toBe(firstId);
        expect(items()[2]).toBe(first);
    });

    it('排序后每个下标变化的项只调用一次 renderTagItem，拿到新下标', async () => {
        gate.resolve();
        const renderTagItem = vi.fn<NonNullable<TagInputProps['renderTagItem']>>((value, index) => <span class="custom">{`${index}:${value}`}</span>);
        render(() => <TagInput defaultValue={['a', 'b', 'c']} draggable renderTagItem={renderTagItem} />);
        fireEvent.click(getRoot());
        await waitFor(() => expect(items()).toHaveLength(3));
        renderTagItem.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'sort-end' }));
        expect(items().map((item) => item.textContent)).toEqual(['0:b', '1:c', '2:a']);
        expect(renderTagItem).toHaveBeenCalledTimes(3);
    });

    it('受控 value 下父组件不接受排序时，列表保持原序，项节点不变', async () => {
        gate.resolve();
        render(() => <TagInput value={['a', 'b', 'c']} draggable />);
        fireEvent.click(getRoot());
        await waitFor(() => expect(items()).toHaveLength(3));
        const before = items();
        fireEvent.click(screen.getByRole('button', { name: 'sort-end' }));
        expect(items()).toEqual(before);
        expect(items().map((item) => item.textContent)).toEqual(['a', 'b', 'c']);
    });
});
