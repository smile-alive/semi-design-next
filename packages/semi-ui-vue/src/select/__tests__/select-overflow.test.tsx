/** @jsxImportSource vue */
import { defineComponent, type PropType } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Select from '..';

// jsdom has no layout, so OverflowList never measures an overflow; a stand-in exposes its overflow event to call
const overflowList = vi.hoisted(() => ({
    items: [] as unknown[],
    overflow: (_items: unknown[]) => undefined as void,
}));
vi.mock('../../overflow-list', () => ({
    default: defineComponent({
        props: { items: { type: Array as PropType<unknown[]>, default: () => [] } },
        emits: ['overflow'],
        setup(props, { emit, slots }) {
            overflowList.overflow = (items) => emit('overflow', items);
            return () => {
                overflowList.items = props.items;
                return props.items.map((item, index) => slots.item?.({ item, index }));
            };
        },
    }),
}));

const optionList = ['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() }));
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('Select ellipsisTrigger', () => {
    it('OverflowList 由溢出变为全部放下时，+N 等于 maxTagCount 之外的数量', async () => {
        render(() => <Select defaultValue={optionList.map((option) => option.value)} multiple ellipsisTrigger maxTagCount={3} motion={false} optionList={optionList} />);
        await settle();
        expect(screen.getByText('+2')).toBeInTheDocument();
        const [first, second] = overflowList.items;
        overflowList.overflow([first, second]);
        await settle();
        expect(screen.getByText('+3')).toBeInTheDocument();
        overflowList.overflow([]);
        await settle();
        expect(screen.getByText('+2')).toBeInTheDocument();
    });
});
