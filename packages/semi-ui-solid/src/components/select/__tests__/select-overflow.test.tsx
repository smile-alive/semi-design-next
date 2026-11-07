import { For } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import Select from '..';
import type { OverflowListProps } from '../../overflow-list';

// jsdom has no layout, so OverflowList never measures an overflow; a stand-in exposes onOverflow to call directly
const overflowList = vi.hoisted(() => ({ props: null as OverflowListProps | null }));
vi.mock('../../overflow-list', () => ({
    default: (props: OverflowListProps) => {
        overflowList.props = props;
        return <For each={props.items}>{(item, index) => <>{props.visibleItemRenderer?.(item, index())}</>}</For>;
    },
}));

const optionList = ['a', 'b', 'c', 'd', 'e'].map((value) => ({ value, label: value.toUpperCase() }));

describe('Select ellipsisTrigger', () => {
    it('OverflowList 由溢出变为全部放下时，+N 等于 maxTagCount 之外的数量', () => {
        render(() => <Select defaultValue={optionList.map((option) => option.value)} multiple ellipsisTrigger maxTagCount={3} motion={false} optionList={optionList} />);
        expect(screen.getByText('+2')).toBeInTheDocument();
        const props = overflowList.props as OverflowListProps;
        const [first, second] = props.items ?? [];
        props.onOverflow?.([first, second]);
        expect(screen.getByText('+3')).toBeInTheDocument();
        props.onOverflow?.([]);
        expect(screen.getByText('+2')).toBeInTheDocument();
    });
});
