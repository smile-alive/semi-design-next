import { StrictMode, createRef, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Button, ConfigProvider } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import LocaleProvider from '@fibrae/semi-ui-react/locale/locale-provider';
import { sleep } from '@test/utils/react';
import Popconfirm, { type PopconfirmHandle, type PopconfirmProps } from '../index';

const prefix = `${BASE_CLASS_PREFIX}-popconfirm`;
const popconfirmSelector = `.${BASE_CLASS_PREFIX}-popover .${BASE_CLASS_PREFIX}-popconfirm`;
const getPopconfirm = () => document.querySelector(popconfirmSelector);
const footerButtons = () => document.querySelectorAll(`.${prefix}-footer button`);

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

// Popconfirm drives its Popover through `visible`, so a click reaches it as an open request before the card mounts
async function openByClick(onVisibleChange) {
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
}

const renderPopconfirm = (props) =>
    render(
        <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" position="bottomLeft" trigger="click" {...props}>
            <Button>Save</Button>
        </Popconfirm>
    );

describe(`Popconfirm`, () => {
    it(`外观`, async () => {
        const onVisibleChange = vi.fn<() => void>();
        renderPopconfirm({ defaultVisible: false, onVisibleChange });
        expect(getPopconfirm()).toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(getPopconfirm()).not.toBeNull();
        expect(screen.getByText('确定是否要保存此修改？')).toBeInTheDocument();
        await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
    });

    it(`禁用状态的外观`, () => {
        renderPopconfirm({ defaultVisible: true, disabled: true });
        expect(getPopconfirm()).toBeNull();
    });

    it(`受控外观`, async () => {
        const onTriggerClick = vi.fn<() => void>();
        function Controlled() {
            const [visible, setVisible] = useState(true);
            return (
                <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" trigger="custom" visible={visible}>
                    <Button
                        onClick={() => {
                            onTriggerClick();
                            setVisible((v) => !v);
                        }}
                    >
                        Save
                    </Button>
                </Popconfirm>
            );
        }
        render(<Controlled />);
        expect(getPopconfirm()).not.toBeNull();

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onTriggerClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it(`按钮`, async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        renderPopconfirm({ onCancel, onConfirm, defaultVisible: true });
        expect(getPopconfirm()).not.toBeNull();

        const [cancelButton] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popconfirm-footer button`);
        await userEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popconfirm-footer button`)).toHaveLength(0));
    });

    it(`按钮 2`, async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        renderPopconfirm({ onCancel, onConfirm, defaultVisible: true });
        expect(getPopconfirm()).not.toBeNull();

        const [, confirmButton] = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popconfirm-footer button`);
        await userEvent.click(confirmButton);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await waitFor(() => expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-popconfirm-footer button`)).toHaveLength(0));
    });

    it('onConfirm 返回 Promise 时显示 loading，resolve 后关闭', async () => {
        const confirm = deferred();
        renderPopconfirm({ defaultVisible: true, onConfirm: () => confirm.promise });
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(footerButtons()[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
        expect(getPopconfirm()).not.toBeNull();
        await act(async () => confirm.resolve());
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('按钮属性里的 loading: false 不取消挂起期间的 loading 与重入保护', async () => {
        const confirm = deferred();
        const onConfirm = vi.fn<() => Promise<unknown>>(() => confirm.promise);
        renderPopconfirm({ defaultVisible: true, onConfirm, okButtonProps: { loading: false } });
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(footerButtons()[1]).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
        await userEvent.click(footerButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await act(async () => confirm.resolve());
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('onCancel 返回 rejected Promise 时停止 loading，保持打开', async () => {
        const cancel = deferred();
        renderPopconfirm({ defaultVisible: true, onCancel: () => cancel.promise });
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await waitFor(() => expect(footerButtons()[0]).toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
        await act(async () => cancel.reject(new Error('no')));
        await waitFor(() => expect(footerButtons()[0]).not.toHaveClass(`${BASE_CLASS_PREFIX}-button-loading`));
        expect(getPopconfirm()).not.toBeNull();
    });

    describe('异步回调挂起期间弹层已被关闭', () => {
        const renderWithOutsideInput = (props) => {
            render(
                <>
                    <input aria-label="outside" />
                    <Popconfirm title="确定是否要保存此修改？" motion={false} position="bottomLeft" {...props}>
                        <Button>Save</Button>
                    </Popconfirm>
                </>
            );
        };

        it.each([
            ['onConfirm', '确定'],
            ['onCancel', '取消'],
        ])('%s 落定时不抢走焦点，也不再次上报关闭', async (callback, name) => {
            const pending = deferred();
            const onVisibleChange = vi.fn<(visible: boolean) => void>();
            renderWithOutsideInput({ [callback]: () => pending.promise, onVisibleChange });
            await openByClick(onVisibleChange);
            await userEvent.click(screen.getByRole('button', { name }));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(getPopconfirm()).toBeNull());
            await userEvent.click(screen.getByLabelText('outside'));
            const closeReports = onVisibleChange.mock.calls.filter(([visible]) => !visible).length;

            await act(async () => pending.resolve());

            expect(screen.getByLabelText('outside')).toHaveFocus();
            expect(onVisibleChange.mock.calls.filter(([visible]) => !visible)).toHaveLength(closeReports);
        });

        it('挂起期间重新打开的弹层不会被旧的 Promise 关掉', async () => {
            const pending = deferred();
            const onVisibleChange = vi.fn<(visible: boolean) => void>();
            renderWithOutsideInput({ onConfirm: () => pending.promise, onVisibleChange });
            await openByClick(onVisibleChange);
            await userEvent.click(screen.getByRole('button', { name: '确定' }));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(getPopconfirm()).toBeNull());
            await openByClick(onVisibleChange);
            await waitFor(() => expect(getPopconfirm()).not.toBeNull());

            await act(async () => {
                pending.resolve();
                await sleep(100);
            });

            expect(getPopconfirm()).not.toBeNull();
        });
    });

    it('按 Escape 关闭弹层并调用 onEscKeyDown', async () => {
        const onEscKeyDown = vi.fn<() => void>();
        const onVisibleChange = vi.fn<() => void>();
        renderPopconfirm({ onEscKeyDown, onVisibleChange, motion: false, okButtonProps: { autoFocus: true } });
        await openByClick(onVisibleChange);
        expect(screen.getByRole('button', { name: '确定' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        expect(onEscKeyDown).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['confirm', '确定'],
        ['cancel', '取消'],
    ])('%s 之后焦点回到触发元素', async (_, name) => {
        const onVisibleChange = vi.fn<() => void>();
        renderPopconfirm({ motion: false, onVisibleChange });
        await openByClick(onVisibleChange);
        await userEvent.click(screen.getByRole('button', { name }));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    });

    it('关闭图标调用 onCancel，并把焦点还给触发元素', async () => {
        const onCancel = vi.fn<() => void>();
        const onVisibleChange = vi.fn<() => void>();
        renderPopconfirm({ onCancel, onVisibleChange, motion: false });
        const trigger = screen.getByRole('button', { name: 'Save' });
        await openByClick(onVisibleChange);
        await userEvent.click(document.querySelector(`.${prefix}-btn-close`));
        expect(onCancel).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('除非设置了 okText 或 cancelText，按钮文本从语言包读取', () => {
        const { unmount } = render(
            <LocaleProvider locale={en_US}>
                <Popconfirm title="t" defaultVisible>
                    <Button>Save</Button>
                </Popconfirm>
            </LocaleProvider>
        );
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        unmount();

        renderPopconfirm({ defaultVisible: true, okText: 'Go', cancelText: 'Stop' });
        expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });

    it('okType / cancelType 与按钮属性传给底部按钮，autoFocus 不落到 DOM', () => {
        renderPopconfirm({
            defaultVisible: true,
            okType: 'danger',
            cancelButtonProps: { className: 'my-cancel', disabled: true, autoFocus: true },
            okButtonProps: { className: 'my-ok' },
        });
        const [cancel, ok] = footerButtons();
        expect(cancel).toHaveClass(`${BASE_CLASS_PREFIX}-button-tertiary-disabled`, 'my-cancel');
        expect(cancel).toBeDisabled();
        expect(cancel).not.toHaveAttribute('autofocus');
        expect(cancel).toHaveAttribute('data-type', 'cancel');
        expect(ok).toHaveClass(`${BASE_CLASS_PREFIX}-button-danger`, 'my-ok');
        expect(ok).toHaveAttribute('data-type', 'ok');
    });

    it('icon 为字符串或数字时也显示', () => {
        const { unmount } = renderPopconfirm({ defaultVisible: true, icon: '!' });
        expect(document.querySelector(`.${prefix}-header-icon`)).toHaveTextContent('!');
        expect(document.querySelector(`.${prefix}-body`)).toHaveClass(`${prefix}-body-withIcon`);
        unmount();
        renderPopconfirm({ defaultVisible: true, icon: 0 });
        expect(document.querySelector(`.${prefix}-header-icon`)).toHaveTextContent('0');
    });

    it.each([
        ['okButtonProps', 'onConfirm', '确定'],
        ['cancelButtonProps', 'onCancel', '取消'],
    ])('%s.onClick 追加调用，不替换 %s 与关闭', async (propName, callbackName, name) => {
        const own = vi.fn<() => void>();
        const callback = vi.fn<() => void>();
        renderPopconfirm({
            defaultVisible: true,
            motion: false,
            [propName]: { onClick: own },
            [callbackName]: callback,
        });
        await userEvent.click(screen.getByRole('button', { name }));
        expect(own).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('onCancel 挂起期间再次点击关闭图标不重复调用', async () => {
        const cancel = deferred();
        const onCancel = vi.fn<() => Promise<unknown>>(() => cancel.promise);
        renderPopconfirm({ defaultVisible: true, onCancel });
        const close = document.querySelector(`.${prefix}-btn-close`);
        await userEvent.click(close);
        await userEvent.click(close);
        expect(onCancel).toHaveBeenCalledTimes(1);
        await act(async () => cancel.resolve());
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('受控模式下挂起期间被父级关闭再打开的弹层不会被旧的 Promise 关掉', async () => {
        const pending = deferred();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        function Controlled() {
            const [visible, setVisible] = useState(true);
            return (
                <>
                    <button onClick={() => setVisible(false)}>hide</button>
                    <button onClick={() => setVisible(true)}>show</button>
                    <Popconfirm title="t" motion={false} visible={visible} onConfirm={() => pending.promise} onVisibleChange={onVisibleChange}>
                        <Button>ctrl</Button>
                    </Popconfirm>
                </>
            );
        }
        render(<Controlled />);
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: 'hide' }));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        await userEvent.click(screen.getByRole('button', { name: 'show' }));
        await waitFor(() => expect(getPopconfirm()).not.toBeNull());
        onVisibleChange.mockClear();

        await act(async () => {
            pending.resolve();
            await sleep(100);
        });

        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        expect(getPopconfirm()).not.toBeNull();
    });

    it('受控值改回 undefined 后，被父级关闭的弹层不会自行重新出现', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (visible?: boolean) => (
            <Popconfirm title="t" motion={false} visible={visible} onVisibleChange={onVisibleChange}>
                <Button>Save</Button>
            </Popconfirm>
        );
        const { rerender } = render(view());
        await openByClick(onVisibleChange);
        rerender(view(false));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        rerender(view(undefined));
        await act(() => sleep(50));
        expect(getPopconfirm()).toBeNull();
    });

    it('有标题和内容时，内容作为对话框的描述', async () => {
        renderPopconfirm({ defaultVisible: true });
        const dialog = await screen.findByRole('dialog', { name: '确定是否要保存此修改？' });
        expect(dialog).toHaveAccessibleDescription('此修改将不可逆');
    });

    it('头部各部分：图标、标题、内容与关闭图标', () => {
        const { unmount } = renderPopconfirm({ defaultVisible: true });
        expect(document.querySelector(`.${prefix}-header-icon`)).toHaveAttribute('x-semi-prop', 'icon');
        expect(screen.getByText('确定是否要保存此修改？')).toHaveAttribute('x-semi-prop', 'title');
        expect(screen.getByText('此修改将不可逆')).toHaveAttribute('x-semi-prop', 'content');
        expect(screen.getByText('此修改将不可逆')).toHaveClass(`${prefix}-body`, `${prefix}-body-withIcon`);
        expect(document.querySelector(`.${prefix}-btn-close`)).not.toBeNull();
        unmount();

        renderPopconfirm({ defaultVisible: true, icon: null, showCloseIcon: false, title: null, content: null });
        expect(document.querySelector(`.${prefix}-header-icon`)).toBeNull();
        expect(document.querySelector(`.${prefix}-btn-close`)).toBeNull();
        expect(document.querySelector(`.${prefix}-header-title`)).toBeNull();
        expect(document.querySelector(`.${prefix}-body`)).toBeNull();
    });

    it('content 为函数时接收 initialFocusRef', () => {
        const content = vi.fn<() => string>(() => 'fn content');
        renderPopconfirm({ defaultVisible: true, content });
        expect(screen.getByText('fn content')).toBeInTheDocument();
        expect(content).toHaveBeenCalledWith({ initialFocusRef: expect.objectContaining({ current: null }) });
    });

    it('className 与 style 作用于卡片，popover 外层获得 popconfirm-popover 类名', () => {
        renderPopconfirm({ defaultVisible: true, className: 'my-confirm', style: { width: 321 } });
        const card = getPopconfirm();
        expect(card).toHaveClass('my-confirm');
        expect(card).toHaveStyle({ width: '321px' });
        const wrapper = document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        expect(wrapper).toHaveClass(`${prefix}-popover`);
        expect(wrapper).not.toHaveClass('my-confirm');
    });

    it('在外部按下鼠标时以原生 MouseEvent 调用 onClickOutSide 并关闭', async () => {
        expectTypeOf<Parameters<NonNullable<PopconfirmProps['onClickOutSide']>>[0]>().toEqualTypeOf<MouseEvent>();
        const onClickOutSide = vi.fn<(e: MouseEvent) => void>();
        const onVisibleChange = vi.fn<() => void>();
        renderPopconfirm({ onClickOutSide, onVisibleChange, motion: false });
        await openByClick(onVisibleChange);
        await userEvent.click(document.body);
        expect(onClickOutSide).toHaveBeenCalledTimes(1);
        const event = onClickOutSide.mock.calls[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event).not.toHaveProperty('nativeEvent');
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('默认 bottomLeft，RTL 下默认 bottomRight', async () => {
        const { unmount } = render(
            <Popconfirm title="t" defaultVisible>
                <Button>ltr</Button>
            </Popconfirm>
        );
        const wrapper = () => document.querySelector(`.${BASE_CLASS_PREFIX}-popover-wrapper`);
        await waitFor(() => expect(wrapper()).toHaveAttribute('x-placement', 'bottomLeft'));
        unmount();
        render(
            <ConfigProvider direction="rtl">
                <Popconfirm title="t" defaultVisible>
                    <Button>rtl</Button>
                </Popconfirm>
            </ConfigProvider>
        );
        await waitFor(() => expect(wrapper()).toHaveAttribute('x-placement', 'bottomRight'));
        expect(wrapper()).toHaveAttribute('dir', 'rtl');
    });

    it('受控 visible 时点击触发元素只通过 onVisibleChange(true) 请求打开，弹层等待 prop', async () => {
        const onVisibleChange = vi.fn<() => void>();
        const { rerender } = render(
            <Popconfirm title="t" visible={false} onVisibleChange={onVisibleChange}>
                <Button>ctrl</Button>
            </Popconfirm>
        );
        await userEvent.click(screen.getByRole('button', { name: 'ctrl' }));
        await act(() => sleep(50));
        expect(getPopconfirm()).toBeNull();
        expect(onVisibleChange).toHaveBeenCalledExactlyOnceWith(true);
        rerender(
            <Popconfirm title="t" visible onVisibleChange={onVisibleChange}>
                <Button>ctrl</Button>
            </Popconfirm>
        );
        await waitFor(() => expect(getPopconfirm()).not.toBeNull());
        // confirming reports the close, but the popup waits for the prop
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        expect(getPopconfirm()).not.toBeNull();
    });

    it('受控 visible 时确认并由使用方关闭后，焦点回到触发元素', async () => {
        function Controlled() {
            const [visible, setVisible] = useState(false);
            return (
                <Popconfirm title="t" motion={false} visible={visible} onVisibleChange={setVisible}>
                    <Button>ctrl</Button>
                </Popconfirm>
            );
        }
        render(<Controlled />);
        await userEvent.click(screen.getByRole('button', { name: 'ctrl' }));
        await waitFor(() => expect(getPopconfirm()).not.toBeNull());
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        expect(screen.getByRole('button', { name: 'ctrl' })).toHaveFocus();
    });

    it('使用方自行打开和关闭时不调用 onVisibleChange，打开时按钮 autoFocus 生效，关闭时焦点回到触发元素', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (visible: boolean) => (
            <Popconfirm title="t" motion={false} okButtonProps={{ autoFocus: true }} visible={visible} onVisibleChange={onVisibleChange}>
                <Button>owner</Button>
            </Popconfirm>
        );
        const { rerender } = render(view(false));
        rerender(view(true));
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        rerender(view(false));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        expect(screen.getByRole('button', { name: 'owner' })).toHaveFocus();
        expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('点击打开再确认，onVisibleChange 依次只报告一次打开和一次关闭', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        renderPopconfirm({ motion: false, onVisibleChange });
        await openByClick(onVisibleChange);
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(getPopconfirm()).toBeNull());
        await sleep(50);
        expect(onVisibleChange.mock.calls).toEqual([[true], [false]]);
    });

    it('afterOpen 经 Popover 传给 Tooltip，打开后调用一次', async () => {
        const afterOpen = vi.fn<() => void>();
        renderPopconfirm({ afterOpen, motion: false });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(afterOpen).toHaveBeenCalledTimes(1));
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Popconfirm: { okText: 'Global OK', showCloseIcon: false } };
        try {
            renderPopconfirm({ defaultVisible: true });
            expect(screen.getByRole('button', { name: 'Global OK' })).toBeInTheDocument();
            expect(document.querySelector(`.${prefix}-btn-close`)).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下可以打开并确认', async () => {
        const onConfirm = vi.fn<() => void>();
        const onVisibleChange = vi.fn<() => void>();
        render(
            <StrictMode>
                <Popconfirm title="t" motion={false} onConfirm={onConfirm} onVisibleChange={onVisibleChange}>
                    <Button>Save</Button>
                </Popconfirm>
            </StrictMode>
        );
        await openByClick(onVisibleChange);
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getPopconfirm()).toBeNull());
    });

    it('ref.focusTrigger 使触发元素获得焦点', () => {
        const ref = createRef<PopconfirmHandle>();
        renderPopconfirm({ ref, motion: false });
        act(() => ref.current.focusTrigger());
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    });

    it('禁用时 ref.focusTrigger 不做任何操作', () => {
        const ref = createRef<PopconfirmHandle>();
        renderPopconfirm({ ref, disabled: true });
        expect(() => act(() => ref.current.focusTrigger())).not.toThrow();
    });

    it('丢弃未声明的 data-* 等属性：没有 DOM 节点接收它们，React 也不告警', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const { container } = renderPopconfirm({
                defaultVisible: true,
                motion: false,
                'data-extra': 'x',
                foo: 'bar',
            });
            await waitFor(() => expect(getPopconfirm()).not.toBeNull());
            expect(document.querySelector('[data-extra]')).toBeNull();
            expect(document.querySelector('[foo]')).toBeNull();
            expect(container.querySelector('[data-extra]')).toBeNull();
            expect(error).not.toHaveBeenCalled();
        } finally {
            error.mockRestore();
        }
    });

    it('点击卡片内部不关闭', async () => {
        renderPopconfirm({ defaultVisible: true });
        await userEvent.click(screen.getByText('此修改将不可逆'));
        expect(getPopconfirm()).not.toBeNull();
    });

    it('stopPropagation={false} 时卡片内的点击仍不到达 document 上的 click 监听', async () => {
        const documentClick = vi.fn<() => void>();
        document.addEventListener('click', documentClick);
        try {
            renderPopconfirm({ defaultVisible: true, stopPropagation: false });
            await userEvent.click(screen.getByText('此修改将不可逆'));
            expect(documentClick).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener('click', documentClick);
        }
    });

    it('hover 触发时确认框仍是以标题命名的对话框', async () => {
        renderPopconfirm({ trigger: 'hover', mouseEnterDelay: 0 });
        await userEvent.hover(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByRole('dialog', { name: '确定是否要保存此修改？' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('关闭按钮名称从语言包读取', () => {
        renderPopconfirm({ defaultVisible: true, showCloseIcon: true });
        expect(screen.getByRole('button', { name: zh_CN.Popconfirm.close })).toBeInTheDocument();
    });

    describe('对话框名称', () => {
        let warn;
        const nameWarnings = () => warn.mock.calls.filter(([message]) => message.includes('accessible name'));
        beforeEach(() => {
            warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        });
        afterEach(() => warn.mockRestore());

        it('标题作为对话框名称', async () => {
            renderPopconfirm({ defaultVisible: true });
            expect(await screen.findByRole('dialog', { name: '确定是否要保存此修改？' })).toBeInTheDocument();
            expect(nameWarnings()).toHaveLength(0);
        });

        it('没有标题时，内容作为对话框名称', async () => {
            renderPopconfirm({ defaultVisible: true, title: undefined });
            expect(await screen.findByRole('dialog', { name: '此修改将不可逆' })).toBeInTheDocument();
            expect(nameWarnings()).toHaveLength(0);
        });

        it.each([[false], ['']])('title 为 %j 时不渲染标题，内容作为名称', async (title) => {
            renderPopconfirm({ defaultVisible: true, title });
            expect(await screen.findByRole('dialog', { name: '此修改将不可逆' })).toBeInTheDocument();
            expect(document.querySelector(`.${prefix}-header-title`)).toBeNull();
        });

        it('用户设置的 aria-label 优先于标题', async () => {
            renderPopconfirm({ defaultVisible: true, 'aria-label': 'Confirm saving' });
            expect(await screen.findByRole('dialog', { name: 'Confirm saving' })).toBeInTheDocument();
        });

        it('没有标题、内容或 aria-label 时只告警一次', async () => {
            renderPopconfirm({ defaultVisible: true, title: undefined, content: undefined });
            await screen.findByRole('dialog');
            expect(nameWarnings()).toHaveLength(1);
        });
    });

    it('打开中卸载时异步补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const { unmount } = render(
            <Popconfirm title="Delete?" afterClose={afterClose} defaultVisible motion={false}>
                <Button>trigger</Button>
            </Popconfirm>
        );
        await screen.findByRole('dialog');
        unmount();
        expect(afterClose).not.toHaveBeenCalled();
        await act(async () => {});
        expect(afterClose).toHaveBeenCalledTimes(1);
    });

    it('打开中设为 disabled 时报告关闭，恢复后不自行弹出', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const { rerender } = renderPopconfirm({ motion: false, onVisibleChange });
        await openByClick(onVisibleChange);
        rerender(
            <Popconfirm title="确定是否要保存此修改？" disabled content="此修改将不可逆" motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                <Button>Save</Button>
            </Popconfirm>
        );
        expect(onVisibleChange).toHaveBeenLastCalledWith(false);
        rerender(
            <Popconfirm title="确定是否要保存此修改？" content="此修改将不可逆" motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                <Button>Save</Button>
            </Popconfirm>
        );
        await sleep(50);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('disabled 切换时触发器保持同一个 DOM 节点，禁用时点击不弹出', async () => {
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = (disabled: boolean) => (
            <Popconfirm title="确定是否要保存此修改？" disabled={disabled} motion={false} trigger="click" onVisibleChange={onVisibleChange}>
                <Button>Save</Button>
            </Popconfirm>
        );
        const { rerender } = render(view(false));
        const trigger = screen.getByRole('button', { name: 'Save' });
        rerender(view(true));
        expect(screen.getByRole('button', { name: 'Save' })).toBe(trigger);
        await userEvent.click(trigger);
        await sleep(50);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(onVisibleChange).not.toHaveBeenCalled();
        rerender(view(false));
        expect(screen.getByRole('button', { name: 'Save' })).toBe(trigger);
        await openByClick(onVisibleChange);
    });

    it('卡片在 shadow root 内时，焦点已移到主文档的元素，关闭后不被拉回触发器', async () => {
        const outside = document.body.appendChild(document.createElement('button'));
        const host = document.body.appendChild(document.createElement('div'));
        const shadow = host.attachShadow({ mode: 'open' });
        const container = shadow.appendChild(document.createElement('div'));
        const view = (visible: boolean) => (
            <Popconfirm title="t" motion={false} trigger="click" visible={visible}>
                <Button>Save</Button>
            </Popconfirm>
        );
        const { rerender } = render(view(true), { container });
        await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).not.toBeNull());
        outside.focus();
        rerender(view(false));
        await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).toBeNull());
        expect(outside).toHaveFocus();
        outside.remove();
        host.remove();
    });
});
