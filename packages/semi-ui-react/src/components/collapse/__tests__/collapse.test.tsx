import { StrictMode, createRef, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { Collapse } from '@fibrae/semi-ui-react';
import { semiGlobal } from '@fibrae/semi-ui-react/utils';
import type { CollapseReactProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-collapse`;

import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { IconPlus, IconMinus, IconCopy } from '@fibrae/semi-icons-react';

let getCollapse = (collapseProps?, panel1Props?) => {
    let panelProps = panel1Props || {};

    return (
        <Collapse {...collapseProps}>
            <Collapse.Panel header="This is panel header 1" itemKey="1" {...panelProps}>
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 2" itemKey="2">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
            <Collapse.Panel header="This is panel header 3" itemKey="3">
                <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
            </Collapse.Panel>
        </Collapse>
    );
};

const getHeaders = () => screen.getAllByRole('button');
const getRows = (container: HTMLElement) => [...container.querySelectorAll(`.${prefixCls}-header`)];
const expectExpanded = (expected: boolean[]) => expect(getHeaders().map((header) => header.getAttribute('aria-expanded'))).toEqual(expected.map(String));

describe('Collapse', () => {
    it('Collapse 自定义 className 与 style', () => {
        const { container } = render(getCollapse({ className: 'test', style: { color: 'red' } }));
        const collapse = container.querySelector(`.${BASE_CLASS_PREFIX}-collapse`);
        expect(collapse).toHaveClass('test');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
    it('Collapse 自定义 expandIcon 与 collapseIcon', async () => {
        const { container } = render(getCollapse({ expandIcon: <IconPlus />, collapseIcon: <IconMinus /> }));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(3);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(2);
    });
    it('Collapse 自定义 extra 内容', () => {
        const { container } = render(
            <Collapse>
                <Collapse.Panel header="This is panel header 1" itemKey="1" extra="1234">
                    <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
                </Collapse.Panel>
                <Collapse.Panel header="This is panel header 2" itemKey="2" extra={<IconCopy />}>
                    <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
                </Collapse.Panel>
            </Collapse>
        );
        const [panel1, panel2] = container.querySelectorAll(`.${BASE_CLASS_PREFIX}-collapse-header-right`);
        expect(panel1).toHaveTextContent('1234');
        expect(panel2.querySelector(`.${BASE_CLASS_PREFIX}-icon-copy`)).not.toBeNull();
    });
    it('手风琴模式只允许展开一个面板', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ accordion: true, defaultActiveKey: ['1', '2'], onChange }));
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
        expectExpanded([false, false, true]);
    });

    it('extra 与切换按钮并列，其自身的 button 不嵌套在切换按钮内', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(
            <Collapse clickHeaderToExpand={false} onChange={onChange}>
                <Collapse.Panel header="title" itemKey="1" extra={<button type="button">copy</button>}>
                    content
                </Collapse.Panel>
            </Collapse>
        );
        const toggle = screen.getByRole('button', { name: 'title' });
        const copy = screen.getByRole('button', { name: 'copy' });
        expect(toggle).not.toContainElement(copy);
        expect(screen.getByRole('heading')).not.toContainElement(copy);
        await userEvent.click(copy);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('面板 id 是合法的 CSS id 选择器，指向面板内容', async () => {
        render(getCollapse({ motion: false }));
        await userEvent.click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(document.querySelector(`#${CSS.escape(id)}`)).toHaveTextContent('Hi, bytedance dance dance.');
        expect(id).not.toMatch(/^\d/);
    });

    it('keepDOM 加 lazyRender：内容消失后在收起状态下恢复，未重新展开前无 aria-controls', async () => {
        const getToggled = (show: boolean) => (
            <Collapse keepDOM motion={false} lazyRender>
                <Collapse.Panel header="header" itemKey="1">
                    {show ? <p>body</p> : null}
                </Collapse.Panel>
            </Collapse>
        );
        const { rerender } = render(getToggled(true));
        await userEvent.click(getHeaders()[0]);
        rerender(getToggled(false));
        await userEvent.click(getHeaders()[0]);
        rerender(getToggled(true));
        expectExpanded([false]);
        expect(screen.queryByText('body')).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        await userEvent.click(getHeaders()[0]);
        expect(document.getElementById(getHeaders()[0].getAttribute('aria-controls'))).not.toBeNull();
    });

    it('只在全局默认值设 Collapsible keepDOM 时，收起面板的内容在 DOM 中且有 aria-controls', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { keepDOM: true } };
        try {
            render(getCollapse({ motion: false }));
            getHeaders().forEach((header) => {
                expect(document.getElementById(header.getAttribute('aria-controls'))).not.toBeNull();
            });
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('类型：onChange 事件为 MouseEvent，activeKey 可为 null', () => {
        const props: CollapseReactProps = {
            activeKey: null,
            onChange: (_key, e) => {
                expectTypeOf(e).toEqualTypeOf<ReactMouseEvent>();
            },
        };
        expect(props.activeKey).toBeNull();
    });

    it('ref 指向根元素与面板元素', () => {
        const ref = createRef<HTMLDivElement>();
        const panelRef = createRef<HTMLDivElement>();
        const { container } = render(
            <Collapse ref={ref}>
                <Collapse.Panel ref={panelRef} header="1" itemKey="1">
                    content
                </Collapse.Panel>
            </Collapse>
        );
        expect(ref.current).toBe(container.querySelector(`.${prefixCls}`));
        expect(panelRef.current).toBe(container.querySelector(`.${prefixCls}-item`));
    });

    it('首次渲染时标题的 aria-controls 指向内容 id，且每个面板唯一', () => {
        render(getCollapse({ keepDOM: true, motion: false }));
        const ids = getHeaders().map((header) => header.getAttribute('aria-controls'));
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => {
            expect(id).toMatch(new RegExp(`^${prefixCls}-`));
            expect(document.getElementById(id)).toHaveClass(`${prefixCls}-content`);
        });
    });

    it('keepDOM 下关闭面板的内容设为 inert 而非 aria-hidden，其控件移出 Tab 顺序', () => {
        render(getCollapse({ keepDOM: true, motion: false }));
        const region = document.getElementById(getHeaders()[0].getAttribute('aria-controls'));
        expect(region).toHaveAttribute('inert');
        expect(region).not.toHaveAttribute('aria-hidden');
    });

    it('未知属性传到根元素', () => {
        const { container } = render(getCollapse({ 'aria-label': 'faq', id: 'faq' }));
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('aria-label', 'faq');
        expect(root).toHaveAttribute('id', 'faq');
    });

    it('onMotionEnd 不传到面板 DOM', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            render(getCollapse({}, { onMotionEnd: () => {} }));
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('受控手风琴展示传入的所有 key，并能从这些 key 切换', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ accordion: true, activeKey: ['1', '2'], onChange }));
        expectExpanded([true, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
    });

    it('onChange 接收点击事件', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ onChange }));
        await userEvent.click(getHeaders()[0]);
        expect(onChange.mock.calls[0][1].type).toBe('click');
        expect(onChange.mock.calls[0][1].target).toBe(getHeaders()[0]);
    });

    it.each([null, false])('children 为 %s 的展开面板没有内容，标题无 aria-controls 且图标禁用', (children) => {
        const { container } = render(
            <Collapse defaultActiveKey="1" keepDOM>
                <Collapse.Panel header="empty" itemKey="1">
                    {children}
                </Collapse.Panel>
            </Collapse>
        );
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('非字符串标题原样放入切换按钮，extra 并列其旁', () => {
        const { container } = render(
            <Collapse expandIconPosition="left">
                <Collapse.Panel header={<b data-testid="node">node header</b>} itemKey="1" extra="more">
                    content
                </Collapse.Panel>
                <Collapse.Panel header={<b>no extra</b>} itemKey="2">
                    content
                </Collapse.Panel>
            </Collapse>
        );
        const [row, plainRow] = getRows(container);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(getHeaders()[0].firstElementChild).toBe(screen.getByTestId('node'));
        expect(getHeaders()[0]).toHaveAccessibleName('node header');
        expect(row.querySelector(`.${prefixCls}-header-right`)).toHaveTextContent('more');
        expect(plainRow.querySelector(`.${prefixCls}-header-right`)).toBeNull();
    });

    it('extra 为 false 时不渲染 extra 占位', () => {
        const { container } = render(getCollapse({}, { extra: false, header: <b>title</b> }));
        expect(getRows(container)[0].querySelector(`.${prefixCls}-header-right`)).toBeNull();
    });

    it('extra 中 Portal 弹层内的点击不切换面板', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { container } = render(
            getCollapse(
                { onChange },
                {
                    extra: (
                        <span>
                            {createPortal(<button type="button">in popup</button>, document.body)}
                            more
                        </span>
                    ),
                }
            )
        );
        await userEvent.click(screen.getByText('in popup'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('more'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(getRows(container)).toHaveLength(3);
    });

    it('内容与标题携带展开状态', async () => {
        const { container } = render(getCollapse({ motion: false, keepDOM: true }));
        const items = container.querySelectorAll(`.${prefixCls}-item`);
        expect(items[0]).not.toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector(`.${prefixCls}-content`)).toHaveAttribute('inert');
        await userEvent.click(getHeaders()[0]);
        expect(items[0]).toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector(`.${prefixCls}-content`)).not.toHaveAttribute('inert');
    });

    it('即使 clickHeaderToExpand 为 false，键盘仍可切换；Tab 跳过禁用面板', async () => {
        render(
            <Collapse clickHeaderToExpand={false}>
                <Collapse.Panel header="a" itemKey="1">
                    one
                </Collapse.Panel>
                <Collapse.Panel disabled header="b" itemKey="2">
                    two
                </Collapse.Panel>
                <Collapse.Panel header="c" itemKey="3">
                    three
                </Collapse.Panel>
            </Collapse>
        );
        await userEvent.tab();
        expect(getHeaders()[0]).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expectExpanded([true, false, false]);
        await userEvent.tab();
        expect(getHeaders()[2]).toHaveFocus();
        await userEvent.keyboard(' ');
        expectExpanded([true, false, true]);
    });

    it('extra 内 input 中的 Enter 与 Space 不切换面板', async () => {
        render(
            <Collapse>
                <Collapse.Panel header="title" itemKey="1" extra={<input aria-label="inner" />}>
                    one
                </Collapse.Panel>
            </Collapse>
        );
        screen.getByLabelText('inner').focus();
        await userEvent.keyboard('{Enter} ');
        expectExpanded([false]);
    });

    it('keepDOM 保留关闭内容时存在 aria-controls，lazyRender 下展开前不存在', async () => {
        const { rerender } = render(getCollapse({ keepDOM: true, motion: false }));
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls'))).not.toBeNull();
        });
        rerender(getCollapse({ keepDOM: true, lazyRender: true, motion: false }));
        expect(getHeaders()[1]).not.toHaveAttribute('aria-controls');
    });

    it('data-* 属性传到根元素与面板元素', () => {
        const { container } = render(
            <Collapse data-foo="bar" data-testid="root">
                <Collapse.Panel style={{ color: 'red' }} data-testid="panel" header="1" itemKey="1">
                    content
                </Collapse.Panel>
            </Collapse>
        );
        expect(screen.getByTestId('root')).toBe(container.querySelector(`.${prefixCls}`));
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('panel')).toHaveClass(`${prefixCls}-item`);
        expect(screen.getByTestId('panel')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Collapse: { expandIconPosition: 'left', defaultActiveKey: '2', clickHeaderToExpand: false },
        };
        try {
            const { container, unmount } = render(getCollapse({}));
            expectExpanded([false, true, false]);
            expect(getRows(container)[0]).toHaveClass(`${prefixCls}-header-iconLeft`);
            await userEvent.click(getRows(container)[0]);
            expectExpanded([false, true, false]);
            unmount();
            const explicit = render(getCollapse({ defaultActiveKey: '3', expandIconPosition: 'right' }));
            expectExpanded([false, false, true]);
            expect(getRows(explicit.container)[0]).not.toHaveClass(`${prefixCls}-header-iconLeft`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下每次点击只切换一次', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(<StrictMode>{getCollapse({ onChange })}</StrictMode>);
        await userEvent.click(getHeaders()[0]);
        await userEvent.click(getHeaders()[0]);
        expect(onChange.mock.calls.map(([keys]) => keys)).toEqual([['1'], []]);
        expectExpanded([false, false, false]);
    });
});
