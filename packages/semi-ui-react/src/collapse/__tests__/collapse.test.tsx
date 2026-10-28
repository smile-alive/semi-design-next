import { StrictMode, createRef, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Collapse } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { CollapseReactProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-collapse`;

import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { IconPlus, IconMinus, IconCopy } from '@fibrae/semi-icons-react';

let getCollapse = (collapseProps?, panel1Props?) => {
    let panelProps = panel1Props ? panel1Props : {};

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
    it('Collapse 使用 defaultActiveKey', () => {
        const { unmount } = render(getCollapse({ defaultActiveKey: '1' }));
        expectExpanded([true, false, false]);
        unmount();

        render(getCollapse({ defaultActiveKey: ['1', '2'] }));
        expectExpanded([true, true, false]);
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
    it('Collapse onChange', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ onChange }));
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
    });
    it('可同时展开多个面板', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ onChange }));
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenLastCalledWith(['2', '3'], expect.anything());
        expectExpanded([false, true, true]);
    });

    it('手风琴模式只允许展开一个面板', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ accordion: true, defaultActiveKey: ['1', '2'], onChange }));
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
        expectExpanded([false, false, true]);
    });

    it('禁用 Collapse', () => {
        const { container } = render(getCollapse({}, { disabled: true }));
        const rows = getRows(container);
        expect(rows[0]).toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[0]).toBeDisabled();
        expect(rows[1]).not.toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[1]).toBeEnabled();
    });

    it('每个标题是原生 button，名称为标题文本，位于三级标题内', () => {
        render(getCollapse({}));
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings).toHaveLength(3);
        const button = screen.getByRole('button', { name: 'This is panel header 1' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(headings[0]).toContainElement(button);
        expect(headings[0]).toHaveAccessibleName('This is panel header 1');
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

    it('隐藏面板图标', () => {
        const { container } = render(
            <Collapse>
                <Collapse.Panel header="This is panel header 1" itemKey="1" showArrow={false}>
                    <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
                </Collapse.Panel>
            </Collapse>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-collapse-header-icon`)).toBeNull();
    });

    it('面板 id 是合法的 CSS id 选择器，指向面板内容', async () => {
        render(getCollapse({ motion: false }));
        await userEvent.click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(document.querySelector(`#${CSS.escape(id)}`)).toHaveTextContent('Hi, bytedance dance dance.');
        expect(id).not.toMatch(/^\d/);
    });

    it('keepDOM 与 lazyRender 下，渲染过的面板收起后仍有 aria-controls', async () => {
        render(getCollapse({ keepDOM: true, lazyRender: true, motion: false }));
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(id).not.toBeNull();
        expect(document.getElementById(id)).not.toBeNull();
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

    it('受控 activeKey 只通过 props 变化', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { rerender } = render(getCollapse({ activeKey: '1', onChange }));
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], expect.anything());
        expectExpanded([true, false, false]);
        rerender(getCollapse({ activeKey: ['2', '3'], onChange }));
        expectExpanded([false, true, true]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenLastCalledWith(['2'], expect.anything());
        rerender(getCollapse({ activeKey: [], onChange }));
        expectExpanded([false, false, false]);
    });

    it('activeKey 优先于 defaultActiveKey', () => {
        render(getCollapse({ activeKey: ['2'], defaultActiveKey: ['1'] }));
        expectExpanded([false, true, false]);
    });

    it("'' 与 null 的 activeKey 是受控的空值，收起全部面板", async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { rerender } = render(getCollapse({ activeKey: ['2'], onChange }));
        for (const activeKey of ['', null]) {
            rerender(getCollapse({ activeKey: ['2'], onChange }));
            expectExpanded([false, true, false]);
            rerender(getCollapse({ activeKey, onChange }));
            expectExpanded([false, false, false]);
            await userEvent.click(getHeaders()[0]);
            expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
            expectExpanded([false, false, false]);
        }
    });

    it('activeKey 变回 undefined 后转为非受控，从最后的受控值继续', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { rerender } = render(getCollapse({ activeKey: ['2'], onChange }));
        rerender(getCollapse({ activeKey: '', onChange }));
        rerender(getCollapse({ onChange }));
        expectExpanded([false, false, false]);
        await userEvent.click(getHeaders()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
        expectExpanded([true, false, false]);
    });

    it('转为非受控后，从上次受控的 activeKey 继续', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { rerender } = render(getCollapse({ activeKey: ['1'], onChange }));
        rerender(getCollapse({ activeKey: ['3'], onChange }));
        rerender(getCollapse({ onChange }));
        expectExpanded([false, false, true]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['3', '2'], expect.anything());
        expectExpanded([false, true, true]);
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

    it('手风琴关闭已展开面板，并以数组形式通知', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ accordion: true, defaultActiveKey: '2', onChange }));
        expectExpanded([false, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything());
        expectExpanded([false, false, false]);
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

    it('禁用面板忽略点击，展开图标显示为禁用态', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { container } = render(getCollapse({ onChange }, { disabled: true }));
        await userEvent.click(getHeaders()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        const icons = container.querySelectorAll(`.${prefixCls}-header-icon`);
        expect(icons[0]).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(icons[1]).not.toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('没有 children 的面板图标禁用、无内容，但仍可切换', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { container } = render(
            <Collapse onChange={onChange}>
                <Collapse.Panel header="empty" itemKey="1" />
            </Collapse>
        );
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(onChange).toHaveBeenCalledWith(['1'], expect.anything());
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('expandIconPosition 为 left 时图标位于标题文本之前', () => {
        const { container } = render(getCollapse({ expandIconPosition: 'left' }));
        const row = getRows(container)[0];
        expect(row).toHaveClass(`${prefixCls}-header-iconLeft`);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-right .${prefixCls}-header-icon`)).toHaveLength(0);
    });

    it('expandIconPosition 为 right 时图标位于 extra 之后', () => {
        const { container } = render(getCollapse({}, { extra: 'more' }));
        const row = getRows(container)[0];
        const right = row.querySelector(`.${prefixCls}-header-right`);
        expect(right).toHaveTextContent('more');
        expect(right.lastElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(row).not.toHaveClass(`${prefixCls}-header-iconLeft`);
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

    it('clickHeaderToExpand 为 false 时仅点击按钮与图标切换，不响应整行点击', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { container } = render(getCollapse({ clickHeaderToExpand: false, onChange }, { extra: 'more' }));
        await userEvent.click(screen.getByText('more'));
        await userEvent.click(getRows(container)[0]);
        expect(onChange).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        await userEvent.click(container.querySelector(`.${prefixCls}-header-icon`));
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
        expectExpanded([true, false, false]);
        await userEvent.click(screen.getByText('This is panel header 2'));
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], expect.anything());
        expectExpanded([true, true, false]);
    });

    it('clickHeaderToExpand 为 true 时点击整行（包括 extra）均可切换', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        const { container } = render(getCollapse({ onChange }, { extra: 'more' }));
        await userEvent.click(screen.getByText('more'));
        expectExpanded([true, false, false]);
        await userEvent.click(getRows(container)[0]);
        expectExpanded([false, false, false]);
        expect(onChange).toHaveBeenCalledTimes(2);
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

    it('未设置 keepDOM 时，折叠内容会被卸载', async () => {
        const { container, unmount } = render(getCollapse({ motion: false, defaultActiveKey: '1' }));
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[0]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        unmount();

        const kept = render(getCollapse({ motion: false, keepDOM: true }));
        expect(kept.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(3);
    });

    it('keepDOM 与 lazyRender 同时使用时，内容首次展开后挂载并保留', async () => {
        const { container } = render(getCollapse({ motion: false, keepDOM: true, lazyRender: true }));
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        await userEvent.click(getHeaders()[1]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
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

    it('标题获得焦点后，Enter 与 Space 切换面板', async () => {
        const onChange = vi.fn<NonNullable<CollapseReactProps['onChange']>>();
        render(getCollapse({ onChange }));
        getHeaders()[0].focus();
        await userEvent.keyboard('{Enter}');
        expectExpanded([true, false, false]);
        await userEvent.keyboard(' ');
        expectExpanded([false, false, false]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
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

    it('标题控制内容，内容为由标题命名的 region', async () => {
        const { container } = render(getCollapse({ motion: false }));
        const [header] = getHeaders();
        expect(header).not.toHaveAttribute('aria-controls');
        await userEvent.click(header);
        const region = document.getElementById(header.getAttribute('aria-controls'));
        expect(region).toHaveClass(`${prefixCls}-content`);
        expect(region).toHaveAttribute('role', 'region');
        expect(region).toHaveAttribute('aria-labelledby', header.id);
        expect(header).not.toHaveAttribute('aria-owns');
        expect(container.querySelector(`#${header.id}`)).toBe(header);
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
