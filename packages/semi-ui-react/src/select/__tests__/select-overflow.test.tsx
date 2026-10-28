import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { OverflowListProps } from '@fibrae/semi-ui-react/overflow-list';
import Select from '../index';

// jsdom has no layout, so OverflowList never measures an overflow; a stand-in exposes onOverflow to call directly
const overflowList = vi.hoisted(() => ({ props: null as OverflowListProps | null }));
vi.mock('@fibrae/semi-ui-react/overflow-list', () => ({
    default: (props: OverflowListProps) => {
        overflowList.props = props;
        return props.items.map((item, index) => props.visibleItemRenderer(item, index));
    },
}));

const optionList = ['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() }));

describe('Select ellipsisTrigger', () => {
    it('OverflowList 由溢出变为全部放下时，+N 等于 maxTagCount 之外的数量', () => {
        render(<Select defaultValue={optionList.map((option) => option.value)} multiple ellipsisTrigger maxTagCount={3} motion={false} optionList={optionList} />);
        expect(screen.getByText('+2')).toBeInTheDocument();
        const [first, second] = overflowList.props.items;
        act(() => overflowList.props.onOverflow([first, second]));
        expect(screen.getByText('+3')).toBeInTheDocument();
        act(() => overflowList.props.onOverflow([]));
        expect(screen.getByText('+2')).toBeInTheDocument();
    });
});
