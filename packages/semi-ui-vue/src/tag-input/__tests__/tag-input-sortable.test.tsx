/** @jsxImportSource vue */
import { nextTick } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import TagInput from '..';

// The sortable list loads lazily; this stand-in waits for the test to release it
const gate = vi.hoisted(() => Promise.withResolvers<void>());
vi.mock('../../_sortable/sortable.vue', async () => {
    await gate.promise;
    const { defineComponent, h: el } = await import('vue');
    return {
        default: defineComponent({
            props: {
                items: { type: Array, required: true },
                prefix: String,
                dragHandleLabel: String,
                dragOverlayClass: String,
                transition: Object,
            },
            emits: ['sortEnd', 'dragging'],
            setup(props, { emit, slots }) {
                return () =>
                    el('div', [
                        ...(props.items as string[]).map((id, index) =>
                            el('div', { key: id, 'data-id': id, class: 'item' }, [
                                el('button', {
                                    class: `${BASE_CLASS_PREFIX}-tagInput-sortable-handle`,
                                    type: 'button',
                                }),
                                slots.item?.({ id, index }),
                            ])
                        ),
                        el('button', { type: 'button', onClick: () => emit('sortEnd', { oldIndex: 0, newIndex: 2 }) }, ['sort-end']),
                    ]);
            },
        }),
    };
});

const tagCls = `${BASE_CLASS_PREFIX}-tagInput`;
const getRoot = () => document.querySelector(`.${tagCls}`) as HTMLElement;
const tagButton = (value: string) => screen.getByRole('button', { name: zh_CN.Tag.closableTag.replace('${tag}', value) });
const items = () => [...document.querySelectorAll<HTMLElement>(`.${tagCls}-sortable-list .item`)];

describe('TagInput 可排序列表', () => {
    it('可排序列表加载前聚焦的标签，加载后焦点落在新列表的同一标签上，TagInput 保持激活', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(() => <TagInput defaultValue={['a', 'b', 'c']} draggable onBlur={onBlur} />);
        tagButton('b').focus();
        await nextTick();
        expect(getRoot()).toHaveClass(`${tagCls}-focus`);
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
                <button>after</button>
            </>
        ));
        tagButton('c').focus();
        await waitFor(() => expect(items()).toHaveLength(3));
        screen.getByRole('button', { name: 'after' }).focus();
        await waitFor(() => expect(items()).toHaveLength(0));
        tagButton('c').focus();
        await nextTick();
        expect(items()).toHaveLength(3);
        await nextTick();
        expect(items()[2]).toContainElement(tagButton('c'));
        expect(tagButton('c')).toHaveFocus();
    });

    it('重复标签排序后被拖动的项保留自己的 id 与节点', async () => {
        gate.resolve();
        render(() => <TagInput defaultValue={['a', 'b', 'a']} draggable />);
        await fireEvent.click(getRoot());
        await waitFor(() => expect(items()).toHaveLength(3));
        const [first] = items();
        const firstId = first.dataset.id;
        await fireEvent.click(screen.getByRole('button', { name: 'sort-end' }));
        expect(items().map((item) => item.textContent)).toEqual(['b', 'a', 'a']);
        expect(items()[2].dataset.id).toBe(firstId);
        expect(items()[2]).toBe(first);
    });
});
