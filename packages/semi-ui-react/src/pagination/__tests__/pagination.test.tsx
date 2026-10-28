import { createRef, type Ref, StrictMode, useState } from 'react';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import ConfigProvider from '@fibrae/semi-ui-react/config-provider';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { endLeaveAnimations } from '@test/utils/react';
import Pagination, { type PaginationProps } from '../index';

const defaultPageSize = 10;
const prefixCls = `${BASE_CLASS_PREFIX}-page`;

const getPageItems = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLButtonElement>(`.${prefixCls}-item`));
const getActivePage = (container) => container.querySelector(`.${prefixCls}-item-active`);
const pageName = (page) => zh_CN.Pagination.pageN.replace('${page}', String(page));
const getRestPages = () => within(document.querySelector(`.${prefixCls}-rest-list`)).getAllByRole('button');

describe('Pagination', () => {
    // Checks the number of rendered page items and the last page number
    it('Pagination total 与 pageSize', () => {
        let maxItemCount = 9;

        const getPageChild = (props) => {
            const { container, unmount } = render(<Pagination {...props} />);
            const children = container.querySelector('ul').children;
            const lastPage = children[children.length - 2].textContent;
            unmount();
            return { length: children.length, lastPage };
        };

        expect(getPageChild({ total: 30 })).toEqual({ length: 5, lastPage: '3' });
        expect(getPageChild({ total: 70 })).toEqual({ length: maxItemCount, lastPage: '7' });
        expect(getPageChild({ total: 200 })).toEqual({ length: maxItemCount, lastPage: '20' });
        expect(getPageChild({ total: 200, pageSize: 50 })).toEqual({ length: Math.ceil(200 / 50) + 2, lastPage: '4' });
    });

    it('Pagination 使用自定义 className 与 style', () => {
        const { container } = render(<Pagination className="test" style={{ color: 'red' }} />);
        const ul = container.querySelector('ul.test');
        expect(ul).not.toBeNull();
        expect(ul).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('渲染 mini pagination', () => {
        const { container } = render(<Pagination size="small" total={90} />);
        expect(container.querySelector(`.${prefixCls}-small`)).not.toBeNull();
    });

    it('Pagination showTotal 与 showSizeChanger', () => {
        const { container } = render(<Pagination showSizeChanger showTotal total={80} />);
        expect(container.querySelector(`.${prefixCls}-total`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
    });

    it('Pagination 使用 defaultCurrentPage', () => {
        const { container } = render(<Pagination defaultCurrentPage={3} showTotal total={80} />);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
        expect(getActivePage(container)).toHaveAttribute('aria-current', 'page');
        expect(container.querySelector(`.${prefixCls}`).children[4]).toHaveTextContent(/^3$/);
    });

    it('首页或末页时自动禁用上一页与下一页按钮', () => {
        const getEnds = (props) => {
            const { unmount } = render(<Pagination {...props} />);
            const result = [zh_CN.Pagination.prev, zh_CN.Pagination.next].map((name) => {
                const button = screen.getByRole<HTMLButtonElement>('button', { name });
                expect(button.classList.contains(`${prefixCls}-item-disabled`)).toBe(button.disabled);
                return button.disabled;
            });
            unmount();
            return result;
        };
        expect(getEnds({ total: 30 })).toEqual([true, false]);
        expect(getEnds({ total: 200, defaultCurrentPage: 20 })).toEqual([false, true]);
        expect(getEnds({ total: 9 })).toEqual([true, true]);
    });

    it('hideOnSingePage', () => {
        const { container, rerender } = render(<Pagination hideOnSinglePage total={10} />);
        expect(container.querySelector(`.${prefixCls}`)).toBeNull();

        rerender(<Pagination hideOnSinglePage total={11} />);
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
    });

    it('nextText 与 prevText', () => {
        const { container } = render(<Pagination nextText="next" prevText="prev" total={200} />);
        expect(container.querySelector(`.${prefixCls}-next`)).toHaveTextContent(/^next$/);
        expect(container.querySelector(`.${prefixCls}-prev`)).toHaveTextContent(/^prev$/);
    });

    it('showTotal 与 showSizeChanger', () => {
        const { container } = render(<Pagination showSizeChanger showTotal total={200} />);
        expect(container.querySelector(`.${prefixCls}-total`)).toHaveTextContent(/^总页数：20$/);
        expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
    });

    it('动态修改 pageSize', () => {
        const props = { total: 200, showSizeChanger: true, pageSize: 10 };
        const { container, rerender } = render(<Pagination {...props} />);
        const getSelectionText = () => container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`);
        rerender(<Pagination {...props} pageSize={40} />);
        expect(getSelectionText()).toHaveTextContent(/^每页条数：40$/);
        expect(getPageItems(container)).toHaveLength(200 / 40 + 2);
        rerender(<Pagination {...props} pageSize={100} />);
        expect(getSelectionText()).toHaveTextContent(/^每页条数：100$/);
        expect(getPageItems(container)).toHaveLength(200 / 100 + 2);
        rerender(<Pagination {...props} pageSize={20} />);
        expect(getSelectionText()).toHaveTextContent(/^每页条数：20$/);
        expect(getPageItems(container)).toHaveLength(9);
    });

    it('onPageChange', async () => {
        let tagetPage = 7;
        const spyOnPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
        const { container } = render(<Pagination total={70} onPageChange={spyOnPageChange} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnPageChange).toHaveBeenCalledTimes(1);
        expect(spyOnPageChange).toHaveBeenCalledWith(tagetPage);
        expect(getActivePage(container)).toHaveTextContent(/^7$/);
    });

    it('回调显式为 null 时翻页照常进行', async () => {
        const { container } = render(<Pagination total={70} onChange={null} onPageChange={null} onPageSizeChange={null} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(getActivePage(container)).toHaveTextContent(/^7$/);
    });

    it('pageSizeOpts', async () => {
        render(<Pagination pageSizeOpts={[10, 20, 30]} showSizeChanger total={200} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30']));
    });

    it('非受控模式下 onChange', async () => {
        let tagetPage = 20;
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const { container } = render(<Pagination total={200} onChange={spyOnChange} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnChange).toHaveBeenCalledWith(tagetPage, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(/^20$/);

        await userEvent.click(getActivePage(container));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.more }));
        expect(spyOnChange).toHaveBeenCalledTimes(1);
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    it('受控模式下 currentPage 与 onChange', async () => {
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const props = { currentPage: 3, total: 200, onChange: spyOnChange };
        const { container, rerender } = render(<Pagination {...props} />);
        await userEvent.click(getPageItems(container)[7]);
        expect(spyOnChange).toHaveBeenCalledWith(20, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
        rerender(<Pagination {...props} currentPage={4} />);
        expect(getActivePage(container)).toHaveTextContent(/^4$/);
    });

    it('showQuickJumper', async () => {
        const spyOnChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const props = { total: 200, onChange: spyOnChange, showQuickJumper: true };
        let quickJumpPage = 5;
        const { container } = render(<Pagination {...props} />);
        const jumper = container.querySelector(`.${prefixCls} .${prefixCls}-quickjump-input-number.${BASE_CLASS_PREFIX}-input-number input`);
        await userEvent.type(jumper, String(quickJumpPage));
        fireEvent.blur(jumper);
        expect(spyOnChange).toHaveBeenCalledWith(quickJumpPage, defaultPageSize);
        expect(getActivePage(container)).toHaveTextContent(new RegExp(`^${quickJumpPage}$`));

        await userEvent.type(jumper, String(props.total / 10 + 1));
        fireEvent.blur(jumper);
        expect(getActivePage(container)).toHaveTextContent(new RegExp(`^${props.total / 10}$`));

        await userEvent.type(jumper, '-1{Enter}');
        expect(getActivePage(container)).toHaveTextContent(/^1$/);
        expect(jumper).toHaveValue('');
    });

    // Enter passes the raw input value, and Number('') is 0: an empty jumper (also after a jump, when typed letters
    // are rejected) used to go to page 1, while blur on the same empty input is a no-op
    it('showQuickJumper 在没有有效数字时忽略 Enter', async () => {
        const { container } = render(<Pagination defaultCurrentPage={20} showQuickJumper total={200} />);
        const jumper = container.querySelector(`.${prefixCls}-quickjump-input-number input`);
        await userEvent.type(jumper, '{Enter}');
        expect(getActivePage(container)).toHaveTextContent(/^20$/);
    });

    describe('页码列表', () => {
        const getPageTexts = (container) =>
            getPageItems(container)
                .slice(1, -1)
                .map((li) => li.textContent);

        it('页数超过 7 时，以当前页为中心截断', () => {
            const { container, rerender } = render(<Pagination currentPage={1} total={200} />);
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '...', '19', '20']);
            rerender(<Pagination currentPage={4} total={200} />);
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '5', '...', '20']);
            rerender(<Pagination currentPage={10} total={200} />);
            expect(getPageTexts(container)).toEqual(['1', '...', '9', '10', '11', '...', '20']);
            rerender(<Pagination currentPage={17} total={200} />);
            expect(getPageTexts(container)).toEqual(['1', '...', '16', '17', '18', '19', '20']);
            rerender(<Pagination currentPage={7} total={70} />);
            expect(getPageTexts(container)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
        });

        it('悬停省略号时列出隐藏页码，点击后跳转到对应页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination defaultCurrentPage={10} total={200} onChange={onChange} />);
            const [left, right] = screen.getAllByRole('button', { name: zh_CN.Pagination.more });
            await userEvent.hover(left);
            await waitFor(() => expect(getRestPages().map((el) => el.textContent)).toEqual(['2', '3', '4', '5', '6', '7', '8']));
            expect(getRestPages()[0]).toHaveAccessibleName(pageName(2));
            await userEvent.unhover(left);
            await userEvent.hover(right);
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(12) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(12) }));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(12, defaultPageSize);
            expect(getActivePage(container)).toHaveTextContent(/^12$/);
        });

        it('隐藏页码列表按 ConfigProvider 的 direction 布局', async () => {
            render(
                <ConfigProvider direction="rtl">
                    <Pagination total={200} />
                </ConfigProvider>
            );
            await userEvent.hover(screen.getByRole('button', { name: zh_CN.Pagination.more }));
            await waitFor(() => expect(document.querySelector(`.${prefixCls}-rest-list`)).toHaveStyle({ direction: 'rtl' }));
        });
    });

    describe('受控与非受控', () => {
        it('currentPage 在受控与非受控之间切换', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container, rerender } = render(<Pagination currentPage={3} total={200} onChange={onChange} />);
            rerender(<Pagination total={200} onChange={onChange} />);
            expect(getActivePage(container)).toHaveTextContent(/^1$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(2) }));
            expect(getActivePage(container)).toHaveTextContent(/^2$/);

            rerender(<Pagination currentPage={5} total={200} onChange={onChange} />);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
            await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
            expect(onChange).toHaveBeenLastCalledWith(6, defaultPageSize);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('非受控模式下 total 或 pageSize 变化时回到第 1 页', () => {
            const { container, rerender } = render(<Pagination defaultCurrentPage={5} total={200} />);
            rerender(<Pagination defaultCurrentPage={5} total={300} />);
            expect(getActivePage(container)).toHaveTextContent(/^1$/);

            rerender(<Pagination defaultCurrentPage={5} pageSize={10} total={300} />);
            rerender(<Pagination defaultCurrentPage={5} pageSize={20} total={300} />);
            expect(getActivePage(container)).toHaveTextContent(/^1$/);
            expect(getPageItems(container)).toHaveLength(9);
        });

        it('total 变化时保留用户在切换器里选的 pageSize', async () => {
            const props = { pageSize: 10, showSizeChanger: true };
            const { container, rerender } = render(<Pagination {...props} total={200} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            act(() => endLeaveAnimations());
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^10$/);
            rerender(<Pagination {...props} total={300} />);
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^15$/);
            rerender(<Pagination {...props} pageSize={50} total={300} />);
            expect(getPageItems(container).at(-2)).toHaveTextContent(/^6$/);
        });

        it('total 变化时保持受控的 currentPage，即使超出末页', () => {
            const { container, rerender } = render(<Pagination currentPage={10} total={200} />);
            rerender(<Pagination currentPage={10} total={300} />);
            expect(getActivePage(container)).toHaveTextContent(/^10$/);
            rerender(<Pagination currentPage={10} total={50} />);
            expect(getActivePage(container)).toBeNull();
            expect(getPageItems(container).map((li) => li.textContent)).toHaveLength(5 + 2);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toBeEnabled();
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeEnabled();
        });
    });

    describe('回调', () => {
        it('每次点击上一页或下一页时各调用一次 onPageChange 与 onChange，禁用的一端不调用', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            render(<Pagination total={30} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(onPageChange.mock.calls).toEqual([[2], [3]]);
            expect(onChange.mock.calls).toEqual([
                [2, 10],
                [3, 10],
            ]);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toBeDisabled();
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.prev }));
            expect(onChange).toHaveBeenLastCalledWith(2, 10);
        });

        it('切换 pageSize 时重新计算当前页', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onPageSizeChange = vi.fn<NonNullable<PaginationProps['onPageSizeChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination defaultCurrentPage={5} showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            // a controlled Select reports the change after the leave animation, which jsdom never ends by itself
            act(() => endLeaveAnimations());
            expect(onPageSizeChange.mock.calls).toEqual([[20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(getActivePage(container)).toHaveTextContent(/^3$/);
            expect(getPageItems(container).filter((li) => li.getAttribute('aria-label')?.startsWith(zh_CN.Pagination.pageN.split('${page}')[0]))).toHaveLength(6);
        });

        it('切换 pageSize 时保持受控的 currentPage，只发出通知', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination currentPage={5} showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            act(() => endLeaveAnimations());
            expect(onChange.mock.calls).toEqual([[3, 20]]);
            expect(onPageChange.mock.calls).toEqual([[3]]);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('设置 preventPageChangeOnPageSizeChange 后，切换 pageSize 保持当前页', async () => {
            const onPageChange = vi.fn<NonNullable<PaginationProps['onPageChange']>>();
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination defaultCurrentPage={5} preventPageChangeOnPageSizeChange showSizeChanger total={200} onChange={onChange} onPageChange={onPageChange} />);
            await userEvent.click(screen.getByRole('combobox'));
            await userEvent.click(await screen.findByText('每页条数：20'));
            act(() => endLeaveAnimations());
            expect(onPageChange).not.toHaveBeenCalled();
            expect(onChange.mock.calls).toEqual([[5, 20]]);
            expect(getActivePage(container)).toHaveTextContent(/^5$/);
        });

        it('把 pageSizeOpts 中缺少的 pageSize 按顺序插入', async () => {
            render(<Pagination pageSize={30} pageSizeOpts={[10, 20, 40]} showSizeChanger total={200} />);
            await userEvent.click(screen.getByRole('combobox'));
            await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：30', '每页条数：40']));
        });
    });

    // findIndex(el > pageSize) is -1 for a pageSize above every option, and splicing at -1 put it before the last one
    it('比所有选项都大的 pageSize 排在最后', async () => {
        render(<Pagination pageSize={200} showSizeChanger total={2000} />);
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['每页条数：10', '每页条数：20', '每页条数：40', '每页条数：100', '每页条数：200']));
    });

    // the page numbers were rebuilt from props.pageSize, which is null when only state holds the page size, and
    // Array.from({ length: Infinity }) threw
    it('未传 pageSize 时，small 模式的 hoverShowPageSelect 在 total 变化后保持有效', async () => {
        const { container, rerender } = render(<Pagination hoverShowPageSelect size="small" total={90} />);
        rerender(<Pagination hoverShowPageSelect size="small" total={120} />);
        await userEvent.hover(container.querySelector(`.${prefixCls}-item-small`));
        await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
        expect(container.querySelector(`.${prefixCls}-item-small`).textContent).toBe('1/12 ');
    });

    describe('快速跳转', () => {
        const getJumper = (container) => container.querySelector(`.${prefixCls}-quickjump-input-number input`);

        it.each([
            ['Enter', '2.5{Enter}'],
            ['失焦', '2.5{Tab}'],
        ])('小数页码经%s跳转时取整', async (_, input) => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination showQuickJumper total={200} onChange={onChange} />);
            await userEvent.type(getJumper(container), input);
            expect(onChange.mock.calls).toEqual([[2, 10]]);
            expect(getActivePage(container)).toHaveTextContent(/^2$/);
        });

        it('按 Enter 跳转，清空输入框，忽略当前页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination showQuickJumper total={200} onChange={onChange} />);
            await userEvent.type(getJumper(container), '7{Enter}');
            expect(onChange.mock.calls).toEqual([[7, 10]]);
            expect(getActivePage(container)).toHaveTextContent(/^7$/);
            expect(getJumper(container)).toHaveValue('');
            await userEvent.type(getJumper(container), '7{Enter}');
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('只有一页或 pagination 被禁用时，快速跳转不可用', () => {
            const { container, rerender } = render(<Pagination showQuickJumper total={10} />);
            expect(container.querySelector(`.${prefixCls}-quickjump`)).toHaveClass(`${prefixCls}-quickjump-disabled`);
            expect(getJumper(container)).toBeDisabled();
            rerender(<Pagination disabled showQuickJumper total={200} />);
            expect(getJumper(container)).toBeDisabled();
            rerender(<Pagination showQuickJumper total={200} />);
            expect(getJumper(container)).toBeEnabled();
        });
    });

    describe('small 尺寸', () => {
        const getCounter = (container) => container.querySelector(`.${prefixCls}-item-small`);

        it('显示当前页 / 总页数，并可通过上一页与下一页翻页', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination showQuickJumper size="small" total={90} onChange={onChange} />);
            const root = container.firstElementChild;
            expect(root.tagName).toBe('UL');
            expect(root).toHaveClass(prefixCls, `${prefixCls}-small`);
            expect(getCounter(container).textContent).toBe('1/9 ');
            expect(getCounter(container).tagName).toBe('DIV');
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(getCounter(container).textContent).toBe('2/9 ');
            expect(onChange).toHaveBeenCalledWith(2, 10);
            expect(container.querySelector(`.${prefixCls}-quickjump`)).not.toBeNull();
            expect(container.querySelector(`.${prefixCls}-switch`)).toBeNull();
        });

        it('设置 hoverShowPageSelect 后悬停时列出所有页码', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(<Pagination hoverShowPageSelect size="small" total={90} onChange={onChange} />);
            expect(getCounter(container).tagName).toBe('BUTTON');
            await userEvent.hover(getCounter(container));
            await waitFor(() => expect(screen.getByRole('button', { name: pageName(1) })).toBeInTheDocument());
            await userEvent.click(screen.getByRole('button', { name: pageName(3) }));
            expect(onChange).toHaveBeenCalledWith(3, 10);
            expect(getCounter(container).textContent).toBe('3/9 ');
        });

        it('只有一页时隐藏并标记为禁用', () => {
            const { container, rerender } = render(<Pagination hideOnSinglePage size="small" total={10} />);
            expect(container.firstElementChild).toBeNull();
            rerender(<Pagination disabled size="small" total={90} />);
            expect(container.firstElementChild).toHaveClass(`${prefixCls}-disabled`);
            expect(getCounter(container)).toHaveClass(`${prefixCls}-item-all-disabled`);
        });
    });

    it('设置 showSizeChanger 时，只有一页也保持显示并给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { container } = render(<Pagination hideOnSinglePage showSizeChanger total={10} />);
            expect(container.querySelector(`.${prefixCls}-switch`)).not.toBeNull();
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Semi Pagination]'));
        } finally {
            warn.mockRestore();
        }
    });

    it('禁用所有页码与尺寸切换器', async () => {
        const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        const { container } = render(<Pagination disabled defaultCurrentPage={5} showSizeChanger total={200} onChange={onChange} />);
        expect(container.querySelector('ul')).toHaveClass(`${prefixCls}-disabled`);
        expect(getActivePage(container)).toHaveClass(`${prefixCls}-item-all-disabled-active`);
        expect(getPageItems(container).every((button) => button.disabled)).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: pageName(6) }));
        await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
        expect(onChange).not.toHaveBeenCalled();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select`)).toHaveClass(`${BASE_CLASS_PREFIX}-select-disabled`);
        await userEvent.hover(screen.getAllByRole('button', { name: zh_CN.Pagination.more })[0]);
        expect(document.querySelector(`.${prefixCls}-rest-list`)).toBeNull();
    });

    it('两种尺寸下 data-* 属性都透传到根元素', () => {
        const { rerender } = render(<Pagination data-foo="bar" data-testid="pagination" total={200} />);
        expect(screen.getByTestId('pagination').tagName).toBe('UL');
        expect(screen.getByTestId('pagination')).toHaveAttribute('data-foo', 'bar');
        rerender(<Pagination data-testid="pagination" size="small" total={200} />);
        expect(screen.getByTestId('pagination').tagName).toBe('UL');
    });

    describe('语义', () => {
        it('是由原生按钮组成的列表，并标记当前页', () => {
            render(<Pagination defaultCurrentPage={10} showQuickJumper showSizeChanger showTotal total={200} />);
            const list = screen.getByRole('list');
            expect([...list.children].every((child) => child.tagName === 'LI')).toBe(true);
            expect(screen.getByRole('button', { name: pageName(10) })).toHaveAttribute('aria-current', 'page');
            expect(screen.getByRole('button', { name: pageName(9) })).not.toHaveAttribute('aria-current');
            expect(screen.getAllByRole('button', { name: zh_CN.Pagination.more })).toHaveLength(2);
            expect(screen.getByRole('spinbutton', { name: zh_CN.Pagination.jumpTo })).toBeInTheDocument();
        });

        it('上一页与下一页按钮以自定义的可见文本作为名称', () => {
            render(<Pagination nextText="Later" prevText="Earlier" total={200} />);
            expect(screen.getByRole('button', { name: 'Earlier' })).toHaveClass(`${prefixCls}-prev`);
            expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(`${prefixCls}-next`);
        });

        it('prevText 与 nextText 没有文字内容时，由语言包命名', () => {
            render(<Pagination nextText={<span aria-hidden>{'>'}</span>} prevText={<svg data-testid="prev-icon" />} total={200} />);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.prev })).toHaveClass(`${prefixCls}-prev`);
            expect(screen.getByRole('button', { name: zh_CN.Pagination.next })).toHaveClass(`${prefixCls}-next`);
        });
    });

    it('回写 pageSize 与内部相同的值时，保持当前页', async () => {
        const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
        function Controlled() {
            const [size, setSize] = useState(10);
            return <Pagination defaultCurrentPage={5} pageSize={size} showSizeChanger total={200} onChange={onChange} onPageSizeChange={setSize} />;
        }
        const { container } = render(<Controlled />);
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(await screen.findByText('每页条数：20'));
        act(() => endLeaveAnimations());
        expect(onChange.mock.calls).toEqual([[3, 20]]);
        expect(getActivePage(container)).toHaveTextContent(/^3$/);
    });

    it('small 尺寸下 showSizeChanger 不生效，单页时仍然隐藏且不给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { container } = render(<Pagination hideOnSinglePage showSizeChanger size="small" total={5} />);
            expect(container.firstElementChild).toBeNull();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('没有任何页时，快速跳转不可用', () => {
        const { container } = render(<Pagination showQuickJumper total={0} />);
        expect(container.querySelector(`.${prefixCls}-quickjump-input-number input`)).toBeDisabled();
    });

    it('使用 LocaleProvider 提供的语言', () => {
        const { container } = render(
            <LocaleProvider locale={en_US}>
                <Pagination showQuickJumper showSizeChanger showTotal total={200} />
            </LocaleProvider>
        );
        expect(container.querySelector(`.${prefixCls}-total`)).toHaveTextContent(/^Total pages: 20$/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`)).toHaveTextContent(/^Items per page: 10$/);
        expect(container.querySelector(`.${prefixCls}-quickjump`)).toHaveTextContent(/^Jump to page$/);
    });

    it('切换语言或每页条数后，每页条数选择器显示新的文案', () => {
        const selectionText = () => document.querySelector(`.${BASE_CLASS_PREFIX}-select-selection-text`);
        const { rerender } = render(
            <LocaleProvider locale={zh_CN}>
                <Pagination pageSize={10} showSizeChanger total={200} />
            </LocaleProvider>
        );
        rerender(
            <LocaleProvider locale={en_US}>
                <Pagination pageSize={10} showSizeChanger total={200} />
            </LocaleProvider>
        );
        expect(selectionText()).toHaveTextContent(/^Items per page: 10$/);
        rerender(
            <LocaleProvider locale={en_US}>
                <Pagination pageSize={20} showSizeChanger total={200} />
            </LocaleProvider>
        );
        expect(selectionText()).toHaveTextContent(/^Items per page: 20$/);
    });

    describe('函数组件', () => {
        it('ref 指向根元素，其他属性透传到根元素', () => {
            const ref = createRef<HTMLUListElement>();
            const { container, rerender } = render(<Pagination ref={ref} id="pager" aria-label="Pages" total={200} />);
            expect(ref.current).toBe(container.querySelector('ul'));
            expect(ref.current).toHaveAttribute('id', 'pager');
            expect(ref.current).toHaveAttribute('aria-label', 'Pages');
            rerender(<Pagination ref={ref} id="pager" aria-label="Pages" size="small" total={200} />);
            expect(ref.current.tagName).toBe('UL');
            expect(ref.current).toHaveAttribute('id', 'pager');
        });

        it('ref 类型是两种尺寸共同的根元素 ul', () => {
            expectTypeOf<PaginationProps['ref']>().toEqualTypeOf<Ref<HTMLUListElement> | undefined>();
        });

        it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
            semiGlobal.config.overrideDefaultProps = { Pagination: { showTotal: true, defaultCurrentPage: 3 } };
            try {
                const { container } = render(<Pagination total={200} />);
                expect(container.querySelector(`.${prefixCls}-total`)).not.toBeNull();
                expect(getActivePage(container)).toHaveTextContent(/^3$/);
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('全局 InputNumber 默认值不给快速跳转框加清除按钮与前后缀', async () => {
            semiGlobal.config.overrideDefaultProps = { InputNumber: { showClear: true, prefix: 'x', suffix: 'y', insetLabel: 'l', addonBefore: 'b', addonAfter: 'a' } };
            try {
                const { container } = render(<Pagination showQuickJumper total={200} />);
                await userEvent.type(container.querySelector(`.${prefixCls}-quickjump-input-number input`), '3');
                expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
                expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-prefix, .${BASE_CLASS_PREFIX}-input-suffix, .${BASE_CLASS_PREFIX}-input-prepend, .${BASE_CLASS_PREFIX}-input-append`)).toBeNull();
            } finally {
                semiGlobal.config.overrideDefaultProps = {};
            }
        });

        it('StrictMode 下每次点击只调用一次 onChange', async () => {
            const onChange = vi.fn<NonNullable<PaginationProps['onChange']>>();
            const { container } = render(
                <StrictMode>
                    <Pagination total={200} onChange={onChange} />
                </StrictMode>
            );
            await userEvent.click(screen.getByRole('button', { name: zh_CN.Pagination.next }));
            expect(onChange.mock.calls).toEqual([[2, 10]]);
            expect(getActivePage(container)).toHaveTextContent(/^2$/);
        });
    });

    it('键盘翻页后，页码按钮保持焦点（页码移动不重挂载按钮）', async () => {
        render(<Pagination defaultCurrentPage={10} total={200} />);
        const next = screen.getByRole('button', { name: pageName(11) });
        act(() => next.focus());
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('button', { name: pageName(11) })).toBe(next);
        expect(next).toHaveFocus();

        const first = render(<Pagination defaultCurrentPage={4} total={200} />);
        const five = within(first.container).getByRole('button', { name: pageName(5) });
        act(() => five.focus());
        await userEvent.keyboard('{Enter}');
        expect(five).toHaveFocus();
    });

    it('prevText、nextText 为 0 时按钮显示 0 并由它命名', () => {
        const { container } = render(<Pagination defaultCurrentPage={2} nextText={0} prevText={0} total={200} />);
        const prev = container.querySelector(`.${prefixCls}-prev`);
        const next = container.querySelector(`.${prefixCls}-next`);
        expect(prev).toHaveTextContent(/^0$/);
        expect(prev).not.toHaveAttribute('aria-label');
        expect(next).toHaveTextContent(/^0$/);
        expect(next).not.toHaveAttribute('aria-label');
    });
});
