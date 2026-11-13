import { type JSX, createSignal, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { IconCopy, IconMinus, IconPlus } from '@fibrae/semi-icons-solid';
import { semiGlobal } from '@fibrae/semi-ui-solid/utils';
import { defined } from '@test/utils/solid';
import Collapse, { type CollapsePanelProps, type CollapseProps } from '..';

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

    it('keepDOM 下关闭面板的内容设为 inert 而非 aria-hidden，其控件移出 Tab 顺序', () => {
        setup({ keepDOM: true, motion: false });
        const region = defined(document.getElementById(getHeaders()[0].getAttribute('aria-controls')!));
        // Solid writes inert as a property, which jsdom does not reflect to the attribute
        expect(region.inert).toBe(true);
        expect(region).not.toHaveAttribute('aria-hidden');
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

    it('Collapse 自定义 class 与 style', () => {
        const { container } = setup({ class: 'test', style: { color: 'red' } });
        const collapse = container.querySelector(`.${prefixCls}`);
        expect(collapse).toHaveClass('test');
        expect(collapse).toHaveStyle({ color: 'rgb(255, 0, 0)' });
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

    it('手风琴模式只允许展开一个面板', async () => {
        const onChange = vi.fn<CollapseChange>();
        setup({ accordion: true, defaultActiveKey: ['1', '2'], onChange });
        expectExpanded([true, false, false]);
        await userEvent.click(getHeaders()[2]);
        expect(onChange).toHaveBeenCalledWith(['3'], expect.anything());
        expectExpanded([false, false, true]);
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

    it('面板 id 是合法的 CSS id 选择器，指向面板内容', async () => {
        setup({ motion: false });
        await userEvent.click(getHeaders()[1]);
        const id = getHeaders()[1].getAttribute('aria-controls')!;
        expect(document.querySelector(`#${CSS.escape(id)}`)).toHaveTextContent('Hi, bytedance dance dance.');
        expect(id).not.toMatch(/^\d/);
    });

    it('只在全局默认值设 Collapsible keepDOM 时，收起面板的内容在 DOM 中且有 aria-controls', () => {
        semiGlobal.config.overrideDefaultProps = { Collapsible: { keepDOM: true } };
        setup({ motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls')!)).not.toBeNull();
        });
    });

    it('keepDOM 保留关闭内容时存在 aria-controls，运行时开启 lazyRender 后展开前不存在', () => {
        const { set } = setup({ keepDOM: true, motion: false });
        getHeaders().forEach((header) => {
            expect(document.getElementById(header.getAttribute('aria-controls')!)).not.toBeNull();
        });
        set({ keepDOM: true, lazyRender: true, motion: false });
        expect(getHeaders()[1]).not.toHaveAttribute('aria-controls');
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
        const ids = getHeaders().map((header) => header.getAttribute('aria-controls')!);
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => {
            expect(id).toMatch(new RegExp(`^${prefixCls}-`));
            expect(document.getElementById(id)).toHaveClass(`${prefixCls}-content`);
        });
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
        expect(document.getElementById(getHeaders()[0].getAttribute('aria-controls')!)).not.toBeNull();
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
