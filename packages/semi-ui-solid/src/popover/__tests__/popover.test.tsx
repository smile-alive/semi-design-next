import { For, Show, createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { sleep } from '@test/utils/solid';
import Popover, { type PopoverHandle, type PopoverProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';
import type { RenderContent, RenderContentProps } from '../../tooltip';

const wrapSelector = `.${BASE_CLASS_PREFIX}-popover`;
const arrowSelector = `.${BASE_CLASS_PREFIX}-popover-icon-arrow`;
// Tooltip names its wrapper after Popover's prefixCls
const tooltipWrapperSelector = `.${BASE_CLASS_PREFIX}-popover-wrapper`;

function spyWarn() {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    return () => warn.mock.calls.filter(([message]) => String(message).includes('[Semi Popover]'));
}

describe('Popover', () => {
    it('外观', () => {
        render(() => (
            <Popover content={<p>I&apos;m content</p>} showArrow trigger="hover" visible>
                {(t) => <Button {...t()}>Hover Me</Button>}
            </Popover>
        ));

        const popover = document.querySelector(wrapSelector);
        expect(popover).not.toBeNull();
        expect(popover).toContainElement(screen.getByText("I'm content"));

        expect(document.querySelector(arrowSelector)).not.toBeNull();
    });

    it('无箭头时的外观', () => {
        render(() => (
            <Popover content={<p>I&apos;m content</p>} spacing={0} trigger="hover" visible>
                {(t) => <Button {...t()}>Hover Me</Button>}
            </Popover>
        ));

        const popover = document.querySelector(wrapSelector);
        expect(popover).not.toBeNull();
        expect(popover).toContainElement(screen.getByText("I'm content"));

        expect(document.querySelector(arrowSelector)).toBeNull();
    });

    it('非受控的 click 触发器点击显示，点击外部隐藏并以原生 MouseEvent 调用 onClickOutSide', async () => {
        expectTypeOf<Parameters<NonNullable<PopoverProps['onClickOutSide']>>[0]>().toEqualTypeOf<MouseEvent>();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const onClickOutSide = vi.fn<(e: MouseEvent) => void>();
        render(() => (
            <Popover content="pop content" motion={false} trigger="click" onClickOutSide={onClickOutSide} onVisibleChange={onVisibleChange}>
                {(t) => <Button {...t()}>toggle</Button>}
            </Popover>
        ));
        expect(document.querySelector(wrapSelector)).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        await waitFor(() => expect(screen.getByText('pop content')).toBeInTheDocument());
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
        // clickTriggerToHide is off: a second click on the trigger keeps it open
        await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
        expect(screen.getByText('pop content')).toBeInTheDocument();
        // a click inside the popup is not a click outside (F3)
        await userEvent.click(screen.getByText('pop content'));
        expect(screen.getByText('pop content')).toBeInTheDocument();
        expect(onClickOutSide).not.toHaveBeenCalled();
        await userEvent.click(document.body);
        await waitFor(() => expect(screen.queryByText('pop content')).toBeNull());
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(false));
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        const event = onClickOutSide.mock.calls[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
    });

    it('受控 visible 配合自定义触发器时只跟随属性，不调用 onVisibleChange，打开后调用 afterOpen', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const afterOpen = vi.fn<() => void>();
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <Popover afterOpen={afterOpen} content="ctrl" motion={false} trigger="custom" visible={visible()} onVisibleChange={onVisibleChange}>
                {(t) => <Button {...t()}>ctrl trigger</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'ctrl trigger' }));
        expect(screen.queryByText('ctrl')).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();

        setVisible(true);
        await waitFor(() => expect(screen.getByText('ctrl')).toBeInTheDocument());
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
        setVisible(false);
        await waitFor(() => expect(screen.queryByText('ctrl')).toBeNull());
        await sleep(50);
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('showArrow 按位置渲染 svg 箭头，并使用 arrowStyle 的颜色', async () => {
        const { unmount } = render(() => (
            <Popover arrowStyle={{ backgroundColor: 'red', borderColor: 'green', borderOpacity: 0.5 }} content="left" position="left" showArrow trigger="custom" visible>
                {(t) => <span {...t()}>left trigger</span>}
            </Popover>
        ));
        await waitFor(() => expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('x-placement', 'left'));
        const wrapper = document.querySelector(tooltipWrapperSelector);
        expect(wrapper).toHaveClass(`${BASE_CLASS_PREFIX}-popover-with-arrow`);
        const paths = document.querySelectorAll<SVGPathElement>(`${arrowSelector} path`);
        expect(paths).toHaveLength(2);
        expect(paths[0].getAttribute('d')?.startsWith('M0.5 0L1.5 0')).toBe(true);
        expect(paths[1].style.fill).toBe('red');
        expect(paths[0].style.fill).toBe('green');
        expect(paths[0].style.opacity).toBe('0.5');
        unmount();

        render(() => (
            <Popover style={{ 'background-color': 'blue' }} content="top" position="top" showArrow trigger="custom" visible>
                {(t) => <span {...t()}>top trigger</span>}
            </Popover>
        ));
        await waitFor(() => expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('x-placement', 'top'));
        const topPaths = document.querySelectorAll<SVGPathElement>(`${arrowSelector} path`);
        expect(topPaths[0].getAttribute('d')?.startsWith('M0 0.5L0 1.5')).toBe(true);
        // without arrowStyle the arrow takes the popup background
        expect(topPaths[1].style.fill).toBe('blue');
    });

    it('showArrow 运行时切换时箭头随之出现和消失', async () => {
        const [showArrow, setShowArrow] = createSignal(false);
        render(() => (
            <Popover content="toggle arrow" showArrow={showArrow()} trigger="custom" visible>
                {(t) => <span {...t()}>trigger</span>}
            </Popover>
        ));
        await screen.findByText('toggle arrow');
        expect(document.querySelector(arrowSelector)).toBeNull();
        setShowArrow(true);
        expect(document.querySelector(arrowSelector)).not.toBeNull();
        setShowArrow(false);
        expect(document.querySelector(arrowSelector)).toBeNull();
    });

    it('content 为函数时接收 initialFocusRef；contentClassName 与 prefixCls 作用于卡片', () => {
        const content = vi.fn<RenderContent>(({ initialFocusRef }) => <input ref={initialFocusRef} aria-label="inner" />);
        render(() => (
            <Popover contentClassName="my-card" content={content} prefixCls="my-pop" trigger="custom" visible>
                {(t) => <span {...t()}>fn trigger</span>}
            </Popover>
        ));
        expect(content).toHaveBeenCalledWith({ initialFocusRef: expect.any(Function) });
        const card = screen.getByRole('textbox', { name: 'inner' }).parentElement?.parentElement;
        expect(card).toHaveClass('my-pop', 'my-card');
        expect(screen.getByRole('textbox', { name: 'inner' }).parentElement).toHaveClass('my-pop-content');
    });

    it('编译为访问器的 JSX content（For、返回 Show 的组件）在弹层打开时随数据更新，已有行不重建', () => {
        const [items, setItems] = createSignal(['a']);
        const Count = () => (
            <Show when={items().length > 1} fallback={<span>one</span>}>
                <span>many</span>
            </Show>
        );
        render(() => (
            <>
                <Popover content={<For each={items()}>{(item) => <span data-testid="row">{item}</span>}</For>} trigger="custom" visible>
                    {(t) => <span {...t()}>rows</span>}
                </Popover>
                <Popover content={<Count />} trigger="custom" visible>
                    {(t) => <span {...t()}>count</span>}
                </Popover>
            </>
        ));
        const first = screen.getByTestId('row');
        expect(screen.getByText('one')).toBeInTheDocument();
        setItems(['a', 'b']);
        expect(screen.getAllByTestId('row').map((row) => row.textContent)).toEqual(['a', 'b']);
        expect(screen.getAllByTestId('row')[0]).toBe(first);
        expect(screen.getByText('many')).toBeInTheDocument();
    });

    it('函数 content 像函数子节点一样被跟踪：函数体读取的 signal 变化时重新渲染，无参函数同样生效', () => {
        const [count, setCount] = createSignal(1);
        render(() => (
            <>
                <Popover content={({ initialFocusRef }: RenderContentProps) => (count() > 1 ? <input ref={initialFocusRef} aria-label="many" /> : <span>single</span>)} trigger="custom" visible>
                    {(t) => <span {...t()}>render</span>}
                </Popover>
                <Popover content={() => <span>{`zero ${count()}`}</span>} trigger="custom" visible>
                    {(t) => <span {...t()}>zero</span>}
                </Popover>
            </>
        ));
        expect(screen.getByText('single')).toBeInTheDocument();
        expect(screen.getByText('zero 1')).toBeInTheDocument();
        setCount(2);
        expect(screen.getByRole('textbox', { name: 'many' })).toBeInTheDocument();
        expect(screen.getByText('zero 2')).toBeInTheDocument();
    });

    it('click 或自定义触发器生成对话框，hover 生成 tooltip', () => {
        const { unmount } = render(() => (
            <Popover content="dialog content" trigger="custom" visible>
                {(t) => <Button {...t()}>dialog trigger</Button>}
            </Popover>
        ));
        const dialogTrigger = screen.getByRole('button', { name: 'dialog trigger' });
        expect(dialogTrigger).toHaveAttribute('aria-haspopup', 'dialog');
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'dialog');
        unmount();

        render(() => (
            <Popover content="tip content" visible>
                {(t) => <Button {...t()}>tip trigger</Button>}
            </Popover>
        ));
        const tipTrigger = screen.getByRole('button', { name: 'tip trigger' });
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'tooltip');
        expect(tipTrigger).toHaveAttribute('aria-describedby', document.querySelector(tooltipWrapperSelector)?.id);
    });

    it('contextMenu 触发器与 click 一样生成对话框', async () => {
        render(() => (
            <Popover aria-label="context menu dialog" content="context content" trigger="contextMenu">
                {(t) => <Button {...t()}>context trigger</Button>}
            </Popover>
        ));
        const trigger = screen.getByRole('button', { name: 'context trigger' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
        await userEvent.pointer({ keys: '[MouseRight]', target: trigger });
        expect(await screen.findByRole('dialog', { name: 'context menu dialog' })).toHaveTextContent('context content');
    });

    it('只有带交互角色的触发器才携带对话框弹层状态', async () => {
        const { unmount } = render(() => (
            <Popover content="popup" trigger="click">
                {(t) => <span {...t()}>generic trigger</span>}
            </Popover>
        ));
        const generic = screen.getByText('generic trigger');
        await userEvent.click(generic);
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(generic).not.toHaveAttribute('aria-expanded');
        expect(generic).not.toHaveAttribute('aria-haspopup');
        unmount();

        render(() => (
            <Popover content="popup" trigger="click">
                {(t) => (
                    <button {...t({ type: 'button' })} type="button">
                        native trigger
                    </button>
                )}
            </Popover>
        ));
        const native = screen.getByRole('button', { name: 'native trigger' });
        expect(native).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(native);
        await waitFor(() => expect(native).toHaveAttribute('aria-expanded', 'true'));
        expect(native).toHaveAttribute('aria-haspopup', 'dialog');
        expect(native).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
    });

    it('hover 触发器在未设置 disableFocusListener 时也会因 focus 打开', async () => {
        const [disableFocusListener, setDisableFocusListener] = createSignal(false);
        render(() => (
            <Popover content="focus content" disableFocusListener={disableFocusListener()} motion={false}>
                {(t) => <Button {...t()}>hover trigger</Button>}
            </Popover>
        ));
        await userEvent.tab();
        expect(await screen.findByText('focus content')).toBeInTheDocument();
        await userEvent.tab();
        await waitFor(() => expect(screen.queryByText('focus content')).toBeNull());

        setDisableFocusListener(true);
        await userEvent.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'hover trigger' })).toHaveFocus();
        await sleep(200);
        expect(screen.queryByText('focus content')).toBeNull();
    });

    it('ref.focusTrigger 使触发元素获得焦点', () => {
        let handle: PopoverHandle | undefined;
        render(() => (
            <Popover ref={(instance) => (handle = instance)} content="ref content" motion={false} trigger="click">
                {(t) => <Button {...t()}>ref trigger</Button>}
            </Popover>
        ));
        handle?.focusTrigger();
        expect(screen.getByRole('button', { name: 'ref trigger' })).toHaveFocus();
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', async () => {
        const original = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = { Popover: { showArrow: true, trigger: 'click' } };
        onTestFinished(() => {
            semiGlobal.config.overrideDefaultProps = original;
        });
        render(() => (
            <Popover content="global" motion={false}>
                {(t) => <Button {...t()}>global trigger</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'global trigger' }));
        await waitFor(() => expect(screen.getByText('global')).toBeInTheDocument());
        expect(document.querySelector(arrowSelector)).not.toBeNull();
    });

    it('触发器由受控 visible 的信号驱动', async () => {
        const [visible, setVisible] = createSignal(false);
        render(() => (
            <Popover content="strict content" motion={false} trigger="custom" visible={visible()}>
                {(t) => <Button {...t({ onClick: () => setVisible((v) => !v) })}>toggle trigger</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'toggle trigger' }));
        await waitFor(() => expect(screen.getByText('strict content')).toBeInTheDocument());
        await userEvent.click(screen.getByRole('button', { name: 'toggle trigger' }));
        await waitFor(() => expect(screen.queryByText('strict content')).toBeNull());
    });

    // Popover has no DOM of its own: unknown props go to Tooltip, which does not forward them anywhere
    it('Popover 上的 data-* 既不落在触发器上，也不落在弹层上', () => {
        render(() => (
            <Popover data-testid="pop-attr" content={<span data-testid="inner">inner</span>} trigger="custom" visible>
                {(t) => (
                    <Button {...t()} data-testid="trigger-attr">
                        attr trigger
                    </Button>
                )}
            </Popover>
        ));
        expect(screen.getByTestId('trigger-attr')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();
        expect(screen.queryByTestId('pop-attr')).toBeNull();
    });

    it('class 与 style 作用于弹层', () => {
        render(() => (
            <Popover class="my-popup" content="styled" style={{ width: '321px' }} trigger="custom" visible>
                {(t) => <span {...t()}>trigger</span>}
            </Popover>
        ));
        const wrapper = document.querySelector(tooltipWrapperSelector);
        expect(wrapper).toHaveClass('my-popup');
        expect(wrapper).toHaveStyle({ width: '321px' });
    });

    it('对话框 Popover 上的 aria-label 与 aria-labelledby 为对话框命名，而非触发器', () => {
        const { unmount } = render(() => (
            <Popover aria-label="Details" content="dialog content" trigger="custom" visible>
                {(t) => <Button {...t()}>dialog trigger</Button>}
            </Popover>
        ));
        expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'dialog trigger' })).not.toHaveAttribute('aria-label');
        unmount();

        render(() => (
            <Popover aria-labelledby="pop-title" content="dialog content" trigger="custom" visible>
                {(t) => <Button {...t()}>dialog trigger</Button>}
            </Popover>
        ));
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'pop-title');
    });

    it('tooltip 类型的 Popover 不接受 aria-label', () => {
        render(() => (
            <Popover aria-label="Details" content="tip content" visible>
                {(t) => <Button {...t()}>tip trigger</Button>}
            </Popover>
        ));
        expect(screen.getByRole('tooltip')).not.toHaveAttribute('aria-label');
    });

    it('对话框 Popover 未命名打开时只告警一次，命名后不告警', async () => {
        const nameWarnings = spyWarn();
        const { unmount } = render(() => (
            <Popover content="unnamed content" trigger="click">
                {(t) => <Button {...t()}>unnamed trigger</Button>}
            </Popover>
        ));
        await userEvent.click(screen.getByRole('button', { name: 'unnamed trigger' }));
        await screen.findByRole('dialog');
        expect(nameWarnings()).toHaveLength(1);
        unmount();
        vi.mocked(console.warn).mockClear();

        render(() => (
            <Popover aria-labelledby="pop-heading" content={<h4 id="pop-heading">Heading</h4>} trigger="custom" visible>
                {(t) => <Button {...t()}>named trigger</Button>}
            </Popover>
        ));
        expect(await screen.findByRole('dialog', { name: 'Heading' })).toBeInTheDocument();
        expect(nameWarnings()).toHaveLength(0);
    });

    it('未命名的自定义触发器对话框 Popover 同样告警', async () => {
        const nameWarnings = spyWarn();
        render(() => (
            <Popover content="controlled content" trigger="custom" visible>
                {(t) => <Button {...t()}>controlled trigger</Button>}
            </Popover>
        ));
        await screen.findByRole('dialog');
        expect(nameWarnings()).toHaveLength(1);
    });

    it('role="presentation" 生成的弹层既不是对话框，也不描述触发器', () => {
        render(() => (
            <Popover role="presentation" content="list content" trigger="custom" visible>
                {(t) => (
                    <select {...t({ 'aria-controls': 'list' })}>
                        <option>combobox</option>
                    </select>
                )}
            </Popover>
        ));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.querySelector(tooltipWrapperSelector)).toHaveAttribute('role', 'presentation');
        const trigger = screen.getByRole('combobox');
        expect(trigger).not.toHaveAttribute('aria-haspopup');
        expect(trigger).not.toHaveAttribute('aria-describedby');
        expect(trigger).toHaveAttribute('aria-controls', 'list');
    });

    it('打开中卸载时补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(() => (
            <Popover afterClose={afterClose} content="content" motion={false} trigger="custom" visible>
                {(t) => <Button {...t()}>trigger</Button>}
            </Popover>
        ));
        await screen.findByRole('dialog');
        expect(afterClose).not.toHaveBeenCalled();
        unmount();
        expect(afterClose).toHaveBeenCalledTimes(1);
    });
});
