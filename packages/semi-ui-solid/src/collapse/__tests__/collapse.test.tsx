import { type JSX, createSignal, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconCopy, IconMinus, IconPlus } from '@fibrae/semi-icons-solid';
import Collapse, { type CollapsePanelProps, type CollapseProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-collapse`;

type CollapseChange = NonNullable<CollapseProps['onChange']>;

const panels = (panel1Props: Partial<CollapsePanelProps> = {}) => (
    <>
        <Collapse.Panel header="This is panel header 1" itemKey="1" {...panel1Props}>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
        </Collapse.Panel>
        <Collapse.Panel header="This is panel header 2" itemKey="2">
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
        </Collapse.Panel>
        <Collapse.Panel header="This is panel header 3" itemKey="3">
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI. </p>
        </Collapse.Panel>
    </>
);

/** Renders three panels; `set` swaps the Collapse props and keeps the instance */
function setup(initial: CollapseProps = {}, panel1Props: Partial<CollapsePanelProps> = {}) {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <Collapse {...props()}>{panels(panel1Props)}</Collapse>);
    return { ...view, set: (next: CollapseProps) => setProps(next) };
}

const getHeaders = () => screen.getAllByRole('button');
const getRows = (container: HTMLElement) => [...container.querySelectorAll(`.${prefixCls}-header`)];
const expectExpanded = (expected: boolean[]) => expect(getHeaders().map((header) => header.getAttribute('aria-expanded'))).toEqual(expected.map(String));

describe('Collapse', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Collapse 自定义 class 与 style', () => {
        const { container } = setup({ class: 'test', style: { color: 'red' } });
        const collapse = container.querySelector(`.${prefixCls}`);
        expect(collapse).toHaveClass('test');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Collapse 使用 defaultActiveKey', () => {
        const { unmount } = setup({ defaultActiveKey: '1' });
        expectExpanded([true, false, false]);
        unmount();

        setup({ defaultActiveKey: ['1', '2'] });
        expectExpanded([true, true, false]);
    });

    it('Collapse 自定义 expandIcon 与 collapseIcon', async () => {
        const { container } = render(() => (
            <Collapse expandIcon={<IconPlus />} collapseIcon={<IconMinus />}>
                {panels()}
            </Collapse>
        ));
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(3);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(getRows(container)[0].querySelector(`.${BASE_CLASS_PREFIX}-icon-minus`)).not.toBeNull();
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-plus`)).toHaveLength(2);
    });

    it('expandIcon 为 null 时不渲染图标内容', () => {
        const { container } = render(() => <Collapse expandIcon={null}>{panels()}</Collapse>);
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toBeEmptyDOMElement();
    });

    it('Collapse 自定义 extra 内容', () => {
        const { container } = render(() => (
            <Collapse>
                <Collapse.Panel header="This is panel header 1" itemKey="1" extra="1234">
                    <p>content</p>
                </Collapse.Panel>
                <Collapse.Panel header="This is panel header 2" itemKey="2" extra={<IconCopy />}>
                    <p>content</p>
                </Collapse.Panel>
            </Collapse>
        ));
        const [panel1, panel2] = container.querySelectorAll(`.${prefixCls}-header-right`);
        expect(panel1).toHaveTextContent('1234');
        expect(panel2.querySelector(`.${BASE_CLASS_PREFIX}-icon-copy`)).not.toBeNull();
    });

    it('Collapse onChange', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ onChange });
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
    });

    it('可同时展开多个面板', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ onChange });
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenLastCalledWith(['2', '3'], expect.anything());
        expectExpanded([false, true, true]);
    });

    it('手风琴模式只允许展开一个面板', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ accordion: true, defaultActiveKey: ['1', '2'], onChange });
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
        expectExpanded([false, false, true]);
    });

    it('禁用 Collapse', () => {
        const { container } = setup({}, { disabled: true });
        const rows = getRows(container);
        expect(rows[0]).toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[0]).toBeDisabled();
        expect(rows[1]).not.toHaveClass(`${prefixCls}-header-disabled`);
        expect(getHeaders()[1]).toBeEnabled();
    });

    it('每个标题是原生 button，名称为标题文本，位于三级标题内', () => {
        setup();
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings).toHaveLength(3);
        const button = screen.getByRole('button', { name: 'This is panel header 1' });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(headings[0]).toContainElement(button);
        expect(headings[0]).toHaveAccessibleName('This is panel header 1');
    });

    it('extra 与切换按钮并列，其自身的 button 不嵌套在切换按钮内', async () => {
        const onChange = vi.fn<CollapseChange>();
        render(() => (
            <Collapse clickHeaderToExpand={false} onChange={onChange}>
                <Collapse.Panel header="title" itemKey="1" extra={<button type="button">copy</button>}>
                    content
                </Collapse.Panel>
            </Collapse>
        ));
        const toggle = screen.getByRole('button', { name: 'title' });
        const copy = screen.getByRole('button', { name: 'copy' });
        expect(toggle).not.toContainElement(copy);
        expect(screen.getByRole('heading')).not.toContainElement(copy);
        await userEvent.click(copy);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('隐藏面板图标', () => {
        const { container } = render(() => (
            <Collapse>
                <Collapse.Panel header="This is panel header 1" itemKey="1" showArrow={false}>
                    <p>content</p>
                </Collapse.Panel>
            </Collapse>
        ));
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toBeNull();
    });

    it('面板 id 是合法的 CSS id 选择器，指向面板内容', async () => {
        setup({ motion: false });
        await userEvent.click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls') as string;
        expect(document.querySelector(`#${CSS.escape(id)}`)).toHaveTextContent('Hi, bytedance dance dance.');
        expect(id).not.toMatch(/^\d/);
    });

    it('keepDOM 与 lazyRender 下，渲染过的面板收起后仍有 aria-controls', async () => {
        setup({ keepDOM: true, lazyRender: true, motion: false });
        await userEvent.click(getHeaders()[1]);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        const id = getHeaders()[1].getAttribute('aria-controls');
        expect(id).not.toBeNull();
        expect(document.getElementById(id as string)).not.toBeNull();
    });

    it('只在全局默认值设 Collapsible keepDOM 时，收起面板的内容在 DOM 中且有 aria-controls', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { keepDOM: true } };
        setup({ motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls') as string)).not.toBeNull();
        });
    });

    it('类型：onChange 事件为 MouseEvent，activeKey 可为 null', () => {
        const props: CollapseProps = {
            activeKey: null,
            onChange: (_key, event) => {
                expectTypeOf(event).toEqualTypeOf<MouseEvent>();
            },
        };
        expect(props.activeKey).toBeNull();
    });

    it('受控 activeKey 只通过 props 变化', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { set } = setup({ activeKey: '1', onChange });
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], expect.anything());
        expectExpanded([true, false, false]);
        set({ activeKey: ['2', '3'], onChange });
        expectExpanded([false, true, true]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenLastCalledWith(['2'], expect.anything());
        set({ activeKey: [], onChange });
        expectExpanded([false, false, false]);
    });

    it('activeKey 优先于 defaultActiveKey', () => {
        setup({ activeKey: ['2'], defaultActiveKey: ['1'] });
        expectExpanded([false, true, false]);
    });

    it("'' 与 null 的 activeKey 是受控的空值，收起全部面板", async () => {
        const onChange = vi.fn<CollapseChange>();
        const { set } = setup({ activeKey: ['2'], onChange });
        for (const activeKey of ['', null]) {
            set({ activeKey: ['2'], onChange });
            expectExpanded([false, true, false]);
            set({ activeKey, onChange });
            expectExpanded([false, false, false]);
            await userEvent.click(getHeaders()[0]);
            expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
            expectExpanded([false, false, false]);
        }
    });

    it('activeKey 变回 undefined 后转为非受控，从最后的受控值继续', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { set } = setup({ activeKey: ['2'], onChange });
        set({ activeKey: '', onChange });
        set({ onChange });
        expectExpanded([false, false, false]);
        await userEvent.click(getHeaders()[0]);
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
        expectExpanded([true, false, false]);
    });

    it('转为非受控后，从上次受控的 activeKey 继续', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { set } = setup({ activeKey: ['1'], onChange });
        set({ activeKey: ['3'], onChange });
        set({ onChange });
        expectExpanded([false, false, true]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['3', '2'], expect.anything());
        expectExpanded([false, true, true]);
    });

    it('父组件挂载时就改了 activeKey，转为非受控后从新值继续', () => {
        const [activeKey, setActiveKey] = createSignal<string[] | undefined>(['1']);
        function Demo() {
            onMount(() => setActiveKey(['2']));
            return <Collapse activeKey={activeKey()}>{panels()}</Collapse>;
        }
        render(() => <Demo />);
        setActiveKey(undefined);
        expectExpanded([false, true, false]);
    });

    it('ref 指向根元素与面板元素', () => {
        let ref: HTMLDivElement | undefined;
        let panelRef: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Collapse ref={(node: HTMLDivElement) => (ref = node)}>
                <Collapse.Panel ref={(node: HTMLDivElement) => (panelRef = node)} header="1" itemKey="1">
                    content
                </Collapse.Panel>
            </Collapse>
        ));
        expect(ref).toBe(container.querySelector(`.${prefixCls}`));
        expect(panelRef).toBe(container.querySelector(`.${prefixCls}-item`));
    });

    it('首次渲染时标题的 aria-controls 指向内容 id，且每个面板唯一', () => {
        setup({ keepDOM: true, motion: false });
        const ids = getHeaders().map((header) => header.getAttribute('aria-controls') as string);
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => {
            expect(id).toMatch(new RegExp(`^${prefixCls}-`));
            expect(document.getElementById(id)).toHaveClass(`${prefixCls}-content`);
        });
    });

    it('keepDOM 下关闭面板的内容设为 inert 而非 aria-hidden，其控件移出 Tab 顺序', () => {
        setup({ keepDOM: true, motion: false });
        const region = document.getElementById(getHeaders()[0].getAttribute('aria-controls') as string) as HTMLElement;
        // Solid writes inert as a property, which jsdom does not reflect to the attribute
        expect(region.inert).toBe(true);
        expect(region).not.toHaveAttribute('aria-hidden');
    });

    it('未知属性传到根元素', () => {
        const { container } = setup({ 'aria-label': 'faq', id: 'faq' });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('aria-label', 'faq');
        expect(root).toHaveAttribute('id', 'faq');
    });

    it('onMotionEnd 不传到面板 DOM', () => {
        const { container } = setup({}, { onMotionEnd: () => {} });
        expect(container.querySelector('[onmotionend]')).toBeNull();
        expect(container.querySelector(`.${prefixCls}-item`)?.getAttributeNames()).toEqual(['class']);
    });

    it('受控手风琴展示传入的所有 key，并能从这些 key 切换', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ accordion: true, activeKey: ['1', '2'], onChange });
        expectExpanded([true, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
    });

    it('手风琴关闭已展开面板，并以数组形式通知', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ accordion: true, defaultActiveKey: '2', onChange });
        expectExpanded([false, true, false]);
        await userEvent.click(getHeaders()[1]);
        expect(onChange).toHaveBeenLastCalledWith([], expect.anything());
        expectExpanded([false, false, false]);
    });

    it('onChange 接收点击事件', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ onChange });
        await userEvent.click(getHeaders()[0]);
        expect(onChange.mock.calls[0][1].type).toBe('click');
        expect(onChange.mock.calls[0][1].target).toBe(getHeaders()[0]);
    });

    // Known gap: telling empty children apart would mean creating them, which closed panels must not do
    it.fails.each([null, false])('children 为 %s 的展开面板没有内容，标题无 aria-controls 且图标禁用', (empty) => {
        const { container } = render(() => (
            <Collapse defaultActiveKey="1" keepDOM>
                <Collapse.Panel header="empty" itemKey="1">
                    {empty as JSX.Element}
                </Collapse.Panel>
            </Collapse>
        ));
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('禁用面板忽略点击，展开图标显示为禁用态', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { container } = setup({ onChange }, { disabled: true });
        await userEvent.click(getHeaders()[0]);
        expect(onChange).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        const icons = container.querySelectorAll(`.${prefixCls}-header-icon`);
        expect(icons[0]).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(icons[1]).not.toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('没有 children 的面板图标禁用、无内容，但仍可切换', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { container } = render(() => (
            <Collapse onChange={onChange}>
                <Collapse.Panel header="empty" itemKey="1" />
            </Collapse>
        ));
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
        expect(container.querySelector(`.${prefixCls}-content`)).toBeNull();
        await userEvent.click(getHeaders()[0]);
        expect(onChange).toHaveBeenCalledWith(['1'], expect.anything());
        expect(container.querySelector(`.${prefixCls}-header-icon`)).toHaveClass(`${prefixCls}-header-iconDisabled`);
    });

    it('expandIconPosition 为 left 时图标位于标题文本之前', () => {
        const { container } = setup({ expandIconPosition: 'left' });
        const row = getRows(container)[0];
        expect(row).toHaveClass(`${prefixCls}-header-iconLeft`);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-right .${prefixCls}-header-icon`)).toHaveLength(0);
    });

    it('expandIconPosition 为 right 时图标位于 extra 之后', () => {
        const { container } = setup({}, { extra: 'more' });
        const row = getRows(container)[0];
        const right = row.querySelector(`.${prefixCls}-header-right`);
        expect(right).toHaveTextContent('more');
        expect(right?.lastElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(row).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('expandIconPosition 在运行时切换时图标换边', () => {
        const { container, set } = setup({});
        set({ expandIconPosition: 'left' });
        expect(getRows(container)[0].firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-icon`)).toHaveLength(3);
        set({ expandIconPosition: 'right' });
        expect(getRows(container)[0].firstElementChild).not.toHaveClass(`${prefixCls}-header-icon`);
        expect(container.querySelectorAll(`.${prefixCls}-header-icon`)).toHaveLength(3);
    });

    it('非字符串标题原样放入切换按钮，extra 并列其旁', () => {
        const { container } = render(() => (
            <Collapse expandIconPosition="left">
                <Collapse.Panel header={<b data-testid="node">node header</b>} itemKey="1" extra="more">
                    content
                </Collapse.Panel>
                <Collapse.Panel header={<b>no extra</b>} itemKey="2">
                    content
                </Collapse.Panel>
            </Collapse>
        ));
        const [row, plainRow] = getRows(container);
        expect(row.firstElementChild).toHaveClass(`${prefixCls}-header-icon`);
        expect(getHeaders()[0].firstElementChild).toBe(screen.getByTestId('node'));
        expect(getHeaders()[0]).toHaveAccessibleName('node header');
        expect(row.querySelector(`.${prefixCls}-header-right`)).toHaveTextContent('more');
        expect(plainRow.querySelector(`.${prefixCls}-header-right`)).toBeNull();
    });

    it('clickHeaderToExpand 为 false 时仅点击按钮与图标切换，不响应整行点击', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { container } = setup({ clickHeaderToExpand: false, onChange }, { extra: 'more' });
        await userEvent.click(screen.getByText('more'));
        await userEvent.click(getRows(container)[0]);
        expect(onChange).not.toHaveBeenCalled();
        expectExpanded([false, false, false]);
        await userEvent.click(container.querySelector(`.${prefixCls}-header-icon`) as Element);
        expect(onChange).toHaveBeenLastCalledWith(['1'], expect.anything());
        expectExpanded([true, false, false]);
        await userEvent.click(screen.getByText('This is panel header 2'));
        expect(onChange).toHaveBeenLastCalledWith(['1', '2'], expect.anything());
        expectExpanded([true, true, false]);
    });

    it('clickHeaderToExpand 为 true 时点击整行（包括 extra）均可切换', async () => {
        const onChange = vi.fn<CollapseChange>();
        const { container } = setup({ onChange }, { extra: 'more' });
        await userEvent.click(screen.getByText('more'));
        expectExpanded([true, false, false]);
        await userEvent.click(getRows(container)[0]);
        expectExpanded([false, false, false]);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('extra 为 false 时不渲染 extra 占位', () => {
        const { container } = setup({}, { extra: false, header: <b>title</b> });
        expect(getRows(container)[0].querySelector(`.${prefixCls}-header-right`)).toBeNull();
    });

    it('extra 中 Portal 弹层内的点击不切换面板', async () => {
        const onChange = vi.fn<CollapseChange>();
        render(() => (
            <Collapse onChange={onChange}>
                <Collapse.Panel
                    header="title"
                    itemKey="1"
                    extra={
                        <span>
                            <Portal>
                                <button type="button">in popup</button>
                            </Portal>
                            more
                        </span>
                    }
                >
                    content
                </Collapse.Panel>
            </Collapse>
        ));
        await userEvent.click(screen.getByText('in popup'));
        expect(onChange).not.toHaveBeenCalled();
        await userEvent.click(screen.getByText('more'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('未设置 keepDOM 时，折叠内容会被卸载', async () => {
        const { container, unmount } = setup({ motion: false, defaultActiveKey: '1' });
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[0]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        unmount();

        const kept = setup({ motion: false, keepDOM: true });
        expect(kept.container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(3);
    });

    it('未设置 keepDOM 时，内容组件在收起时销毁，再次展开时重新创建', () => {
        const mounted = vi.fn<() => void>();
        function Content() {
            onMount(mounted);
            return <span>content</span>;
        }
        const [activeKey, setActiveKey] = createSignal('1');
        render(() => (
            <Collapse activeKey={activeKey()} motion={false}>
                <Collapse.Panel header="h" itemKey="1">
                    <Content />
                </Collapse.Panel>
            </Collapse>
        ));
        setActiveKey('');
        expect(screen.queryByText('content')).toBeNull();
        setActiveKey('1');
        expect(mounted).toHaveBeenCalledTimes(2);
    });

    it('lazyRender 下收起的面板在首次展开前不创建内容组件', async () => {
        const mounted = vi.fn<() => void>();
        function Content() {
            onMount(mounted);
            return <span>content</span>;
        }
        render(() => (
            <Collapse keepDOM lazyRender motion={false}>
                <Collapse.Panel header="h" itemKey="1">
                    <Content />
                </Collapse.Panel>
            </Collapse>
        ));
        expect(mounted).not.toHaveBeenCalled();
        await userEvent.click(getHeaders()[0]);
        expect(mounted).toHaveBeenCalledTimes(1);
    });

    it('keepDOM 与 lazyRender 同时使用时，内容首次展开后挂载并保留', async () => {
        const { container } = setup({ motion: false, keepDOM: true, lazyRender: true });
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(0);
        await userEvent.click(getHeaders()[1]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
        await userEvent.click(getHeaders()[1]);
        expectExpanded([false, false, false]);
        expect(container.querySelectorAll(`.${prefixCls}-content-wrapper`)).toHaveLength(1);
    });

    it('内容与标题携带展开状态', async () => {
        const { container } = setup({ motion: false, keepDOM: true });
        const items = container.querySelectorAll(`.${prefixCls}-item`);
        expect(items[0]).not.toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector<HTMLElement>(`.${prefixCls}-content`)?.inert).toBe(true);
        await userEvent.click(getHeaders()[0]);
        expect(items[0]).toHaveClass(`${prefixCls}-item-active`);
        expect(items[0].querySelector<HTMLElement>(`.${prefixCls}-content`)?.inert).toBe(false);
    });

    it('标题获得焦点后，Enter 与 Space 切换面板', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ onChange });
        getHeaders()[0].focus();
        await userEvent.keyboard('{Enter}');
        expectExpanded([true, false, false]);
        await userEvent.keyboard(' ');
        expectExpanded([false, false, false]);
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[0][0]).toEqual(['1']);
    });

    it('即使 clickHeaderToExpand 为 false，键盘仍可切换；Tab 跳过禁用面板', async () => {
        render(() => (
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
        ));
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
        render(() => (
            <Collapse>
                <Collapse.Panel header="title" itemKey="1" extra={<input aria-label="inner" />}>
                    one
                </Collapse.Panel>
            </Collapse>
        ));
        screen.getByLabelText('inner').focus();
        await userEvent.keyboard('{Enter} ');
        expectExpanded([false]);
    });

    it('标题控制内容，内容为由标题命名的 region', async () => {
        const { container } = setup({ motion: false });
        const [header] = getHeaders();
        expect(header).not.toHaveAttribute('aria-controls');
        await userEvent.click(header);
        const region = document.getElementById(header.getAttribute('aria-controls') as string);
        expect(region).toHaveClass(`${prefixCls}-content`);
        expect(region).toHaveAttribute('role', 'region');
        expect(region).toHaveAttribute('aria-labelledby', header.id);
        expect(header).not.toHaveAttribute('aria-owns');
        expect(container.querySelector(`#${header.id}`)).toBe(header);
    });

    it('keepDOM 加 lazyRender：内容消失后在收起状态下恢复，未重新展开前无 aria-controls', async () => {
        const [show, setShow] = createSignal(true);
        render(() => (
            <Collapse keepDOM lazyRender motion={false}>
                <Collapse.Panel header="header" itemKey="1" {...(show() ? { children: <p>body</p> } : {})} />
            </Collapse>
        ));
        await userEvent.click(getHeaders()[0]);
        setShow(false);
        await userEvent.click(getHeaders()[0]);
        setShow(true);
        expectExpanded([false]);
        expect(screen.queryByText('body')).toBeNull();
        expect(getHeaders()[0]).not.toHaveAttribute('aria-controls');
        await userEvent.click(getHeaders()[0]);
        expect(document.getElementById(getHeaders()[0].getAttribute('aria-controls') as string)).not.toBeNull();
    });

    it('keepDOM 保留关闭内容时存在 aria-controls，lazyRender 下展开前不存在', () => {
        const { set } = setup({ keepDOM: true, motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls') as string)).not.toBeNull();
        });
        set({ keepDOM: true, lazyRender: true, motion: false });
        expect(getHeaders()[1]).not.toHaveAttribute('aria-controls');
    });

    it('data-* 属性传到根元素与面板元素', () => {
        const { container } = render(() => (
            <Collapse data-foo="bar" data-testid="root">
                <Collapse.Panel style={{ color: 'red' }} data-testid="panel" header="1" itemKey="1">
                    content
                </Collapse.Panel>
            </Collapse>
        ));
        expect(screen.getByTestId('root')).toBe(container.querySelector(`.${prefixCls}`));
        expect(screen.getByTestId('root')).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByTestId('panel')).toHaveClass(`${prefixCls}-item`);
        expect(screen.getByTestId('panel')).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Collapse: { expandIconPosition: 'left', defaultActiveKey: '2', clickHeaderToExpand: false },
        };
        const { container, unmount } = setup();
        expectExpanded([false, true, false]);
        expect(getRows(container)[0]).toHaveClass(`${prefixCls}-header-iconLeft`);
        await userEvent.click(getRows(container)[0]);
        expectExpanded([false, true, false]);
        unmount();
        const explicit = setup({ defaultActiveKey: '3', expandIconPosition: 'right' });
        expectExpanded([false, false, true]);
        expect(getRows(explicit.container)[0]).not.toHaveClass(`${prefixCls}-header-iconLeft`);
    });

    it('Panel 脱离 Collapse 时抛错', () => {
        expect(() => render(() => <Collapse.Panel header="a" itemKey="1" />)).toThrow('Collapse.Panel must be used inside Collapse');
    });
});
