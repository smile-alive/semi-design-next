import { Activity } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import Table from '../index';

const columns = [{ title: '名称', dataIndex: 'name' }];
const dataSource = [
    { key: '1', name: '甲' },
    { key: '2', name: '乙' },
];

describe('Activity 隐藏再显示 Table', () => {
    it('defaultExpandedRowKeys：用户收起的行保持收起', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Table columns={columns} dataSource={dataSource} defaultExpandedRowKeys={['1']} pagination={false} expandedRowRender={(record) => <p>{`详情 ${record.name}`}</p>} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        const [first] = screen.getAllByRole('button', { expanded: true });
        await userEvent.click(first);
        expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
        const focused = document.activeElement;

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
        expect(document.activeElement).toBe(focused);
    });

    it('用户翻到的页保持不变', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Table columns={columns} dataSource={dataSource} pagination={{ pageSize: 1 }} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByText('2'));
        expect(screen.getByText('乙')).toBeInTheDocument();

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(screen.getByText('乙')).toBeInTheDocument();
        expect(screen.queryByText('甲')).not.toBeInTheDocument();
    });

    it('defaultSelectedRowKeys：用户取消的勾选保持取消', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Table columns={columns} dataSource={dataSource} pagination={false} rowSelection={{ defaultSelectedRowKeys: ['1'] }} />
            </Activity>
        );
        const { rerender } = render(view('visible'));
        const checked = () => screen.queryAllByRole('checkbox', { checked: true });
        expect(checked()).toHaveLength(1);
        await userEvent.click(checked()[0]);
        expect(checked()).toHaveLength(0);

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        expect(checked()).toHaveLength(0);
    });
});
