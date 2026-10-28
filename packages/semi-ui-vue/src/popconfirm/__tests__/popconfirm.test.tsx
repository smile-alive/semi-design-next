/** @jsxImportSource vue */
import { isRef, nextTick } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import semiGlobal from '../../_utils/semi-global';
import Button from '../../button';
import ConfigProvider from '../../config-provider/config-provider.vue';
import LocaleProvider from '../../locale/locale-provider.vue';
import type { PopconfirmEmits, PopconfirmProps, PopconfirmSlots } from '../interface';
import Popconfirm from '../popconfirm.vue';
import ContentClick from './fixtures/content-click.vue';
import ContentFocus from './fixtures/content-focus.vue';
import Described from './fixtures/described.vue';
import Handle from './fixtures/handle.vue';
import Model from './fixtures/model.vue';
import Outside from './fixtures/outside.vue';

const card = () => document.querySelector('.semi-popover .semi-popconfirm');
const footerButtons = () => document.querySelectorAll<HTMLElement>('.semi-popconfirm-footer button');
const cardShown = () => waitFor(() => expect(footerButtons()).toHaveLength(2));
const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

function deferred<T = void>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

type SlotMap = Record<string, ((...args: never[]) => unknown) | undefined>;

function renderPopconfirm(props: PopconfirmProps & Record<string, unknown> = {}, slots: SlotMap = {}) {
    const all: SlotMap = {
        default: () => <Button>{() => 'Save'}</Button>,
        title: () => '确定是否要保存此修改？',
        content: () => '此修改将不可逆',
        ...slots,
    };
    return render(Popconfirm, {
        props: { motion: false, position: 'bottomLeft', ...props },
        slots: Object.fromEntries(Object.entries(all).filter(([, slot]) => slot)) as never,
    });
}

async function renderOpen(props: PopconfirmProps & Record<string, unknown> = {}, slots: SlotMap = {}) {
    const view = renderPopconfirm({ defaultVisible: true, ...props }, slots);
    await cardShown();
    return view;
}

describe('Popconfirm', () => {
    afterEach(() => {
        semiGlobal.config = {};
    });

    it('点击触发元素打开，标题在，visibleChange 发出 true', async () => {
        const view = renderPopconfirm();
        expect(card()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('确定是否要保存此修改？')).toBeInTheDocument();
        expect(card()).not.toBeNull();
        expect(view.emitted().visibleChange).toEqual([[true]]);
        expect(view.emitted()['update:visible']).toEqual([[true]]);
    });

    it('disabled 时不渲染卡片，触发元素仍在，翻转后可打开', async () => {
        const view = renderPopconfirm({ defaultVisible: true, disabled: true });
        expect(card()).toBeNull();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        await view.rerender({ disabled: false, defaultVisible: false });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('打开状态下 disabled 翻为 true 卡片消失并报告关闭，翻回 false 后不自行弹出', async () => {
        const view = await renderOpen();
        await view.rerender({ disabled: true });
        expect(card()).toBeNull();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(view.emitted().visibleChange).toEqual([[false]]);
        await view.rerender({ disabled: false });
        await settle(50);
        expect(card()).toBeNull();
    });

    it('trigger=custom 加 v-model:visible 由使用方切换', async () => {
        render(Model, { props: { trigger: 'custom' } });
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('visible')).toHaveTextContent('true');
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(card()).toBeNull());
        expect(screen.getByLabelText('visible')).toHaveTextContent('false');
    });

    it('v-model:visible 双向：触发器、确认与 Escape 同步取值', async () => {
        render(Model);
        const value = () => screen.getByLabelText('visible');
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await cardShown();
        expect(value()).toHaveTextContent('true');
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(card()).toBeNull());
        expect(value()).toHaveTextContent('false');
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await cardShown();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBeNull());
        expect(value()).toHaveTextContent('false');
    });

    it('取消按钮：onCancel 一次，onConfirm 零次，关闭', async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        await renderOpen({ onCancel, onConfirm });
        await userEvent.click(footerButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
        await waitFor(() => expect(footerButtons()).toHaveLength(0));
    });

    it('确认按钮：onConfirm 一次，onCancel 零次，关闭，visibleChange 只报一次关闭', async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        const view = await renderOpen({ onCancel, onConfirm });
        await userEvent.click(footerButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await waitFor(() => expect(footerButtons()).toHaveLength(0));
        await settle();
        expect(view.emitted().visibleChange).toEqual([[false]]);
    });

    it('onConfirm 返回 Promise 时显示 loading，resolve 后关闭', async () => {
        const confirm = deferred();
        await renderOpen({ onConfirm: () => confirm.promise });
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(footerButtons()[1]).toHaveClass('semi-button-loading'));
        expect(card()).not.toBeNull();
        confirm.resolve();
        await waitFor(() => expect(card()).toBeNull());
    });

    it('onCancel 返回 rejected Promise 时停止 loading，保持打开', async () => {
        const cancel = deferred();
        await renderOpen({ onCancel: () => cancel.promise });
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await waitFor(() => expect(footerButtons()[0]).toHaveClass('semi-button-loading'));
        cancel.reject(new Error('no'));
        await waitFor(() => expect(footerButtons()[0]).not.toHaveClass('semi-button-loading'));
        expect(card()).not.toBeNull();
    });

    it('onCancel 挂起期间再次点击关闭图标不重复调用', async () => {
        const cancel = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => cancel.promise);
        await renderOpen({ onCancel });
        const close = screen.getByRole('button', { name: zh_CN.Popconfirm.close });
        await userEvent.click(close);
        await userEvent.click(close);
        expect(onCancel).toHaveBeenCalledTimes(1);
        cancel.resolve();
        await waitFor(() => expect(card()).toBeNull());
    });

    it('受控模式下挂起期间被父级关闭再打开的弹层不会被旧的 Promise 关掉', async () => {
        const pending = deferred();
        const onVisibleChange = vi.fn<(visible: boolean) => void>();
        const view = renderPopconfirm({ visible: true, onConfirm: () => pending.promise, onVisibleChange });
        await cardShown();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await view.rerender({ visible: false });
        await waitFor(() => expect(card()).toBeNull());
        expect(onVisibleChange).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
        await view.rerender({ visible: true });
        await cardShown();
        onVisibleChange.mockClear();

        pending.resolve();
        await settle(100);

        expect(onVisibleChange).not.toHaveBeenCalledWith(false);
        expect(card()).not.toBeNull();
    });

    describe('异步回调挂起期间弹层已被关闭', () => {
        const opened = async (onVisibleChange: ReturnType<typeof vi.fn>) => {
            await userEvent.click(screen.getByRole('button', { name: 'Save' }));
            await waitFor(() => expect(onVisibleChange).toHaveBeenLastCalledWith(true));
            await cardShown();
        };

        it.each([
            ['onConfirm', '确定'],
            ['onCancel', '取消'],
        ])('%s 落定时不抢走焦点，也不再次上报关闭', async (callback, name) => {
            const pending = deferred();
            const onVisibleChange = vi.fn<(visible: boolean) => void>();
            render(Outside, { props: { [callback]: () => pending.promise, onVisibleChange } });
            await opened(onVisibleChange);
            await userEvent.click(screen.getByRole('button', { name }));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(card()).toBeNull());
            await userEvent.click(screen.getByLabelText('outside'));
            const closeReports = onVisibleChange.mock.calls.filter(([visible]) => !visible).length;

            pending.resolve();
            await settle();

            expect(screen.getByLabelText('outside')).toHaveFocus();
            expect(onVisibleChange.mock.calls.filter(([visible]) => !visible)).toHaveLength(closeReports);
        });

        it('挂起期间重新打开的弹层不会被旧的 Promise 关掉', async () => {
            const pending = deferred();
            const onVisibleChange = vi.fn<(visible: boolean) => void>();
            render(Outside, { props: { onConfirm: () => pending.promise, onVisibleChange } });
            await opened(onVisibleChange);
            await userEvent.click(screen.getByRole('button', { name: '确定' }));
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(card()).toBeNull());
            await opened(onVisibleChange);

            pending.resolve();
            await settle(100);

            expect(card()).not.toBeNull();
        });
    });

    it('Escape 关闭弹层并发出 escKeyDown，确认按钮 autoFocus 生效', async () => {
        const view = renderPopconfirm({ okButtonProps: { autoFocus: true } });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBeNull());
        expect(view.emitted<PopconfirmEmits['escKeyDown']>('escKeyDown')).toHaveLength(1);
        expect(view.emitted<PopconfirmEmits['escKeyDown']>('escKeyDown')[0][0]).toBeInstanceOf(KeyboardEvent);
    });

    it.each([
        ['confirm', '确定'],
        ['cancel', '取消'],
    ])('%s 之后焦点回到触发元素', async (_, name) => {
        renderPopconfirm();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await userEvent.click(await screen.findByRole('button', { name }));
        await waitFor(() => expect(card()).toBeNull());
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    });

    it('关闭图标调用 onCancel，并把焦点还给触发元素', async () => {
        const onCancel = vi.fn<() => void>();
        renderPopconfirm({ onCancel });
        const trigger = screen.getByRole('button', { name: 'Save' });
        await userEvent.click(trigger);
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Popconfirm.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(card()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('除非设置了 okText 或 cancelText，按钮文本从语言包读取', async () => {
        const english = render(LocaleProvider, {
            props: { locale: en_US },
            slots: {
                default: () => (
                    <Popconfirm defaultVisible motion={false}>
                        {{
                            default: () => <Button>{() => 'Save'}</Button>,
                            title: () => 't',
                        }}
                    </Popconfirm>
                ),
            },
        });
        expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        english.unmount();

        await renderOpen({ okText: 'Go', cancelText: 'Stop' });
        expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });

    it('okType / cancelType 与按钮属性传给底部按钮，autoFocus 不落到 DOM', async () => {
        await renderOpen({
            okType: 'danger',
            cancelButtonProps: { class: 'my-cancel', disabled: true, autoFocus: true },
            okButtonProps: { class: 'my-ok' },
        });
        const [cancel, ok] = footerButtons();
        expect(cancel).toHaveClass('semi-button-tertiary-disabled', 'my-cancel');
        expect(cancel).toBeDisabled();
        expect(cancel).not.toHaveAttribute('autofocus');
        expect(cancel).toHaveAttribute('data-type', 'cancel');
        expect(ok).toHaveClass('semi-button-danger', 'my-ok');
        expect(ok).toHaveAttribute('data-type', 'ok');
    });

    it('按钮属性里的 data-type 不影响 autoFocus 查找', async () => {
        const okButtonProps = { autoFocus: true, 'data-type': 'custom' };
        renderPopconfirm({ okButtonProps });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        expect(footerButtons()[1]).toHaveAttribute('data-type', 'ok');
    });

    it('按钮属性里的 loading: false 不取消挂起期间的 loading 与重入保护', async () => {
        const confirm = deferred();
        const onConfirm = vi.fn<() => Promise<void>>(() => confirm.promise);
        await renderOpen({ onConfirm, okButtonProps: { loading: false } });
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(footerButtons()[1]).toHaveClass('semi-button-loading'));
        await userEvent.click(footerButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        confirm.resolve();
        await waitFor(() => expect(card()).toBeNull());
    });

    it('okButtonProps.onClick 追加调用，确认流程不丢', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const onConfirm = vi.fn<(event: MouseEvent) => void>();
        await renderOpen({ onConfirm, okButtonProps: { onClick } });
        await userEvent.click(footerButtons()[1]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(card()).toBeNull());
    });

    it('onConfirm 收到原生 MouseEvent', async () => {
        const onConfirm = vi.fn<(event: MouseEvent) => void>();
        await renderOpen({ onConfirm });
        await userEvent.click(footerButtons()[1]);
        const event = onConfirm.mock.calls[0][0];
        expect(event).toBeInstanceOf(MouseEvent);
        expect(event).not.toHaveProperty('nativeEvent');
    });

    it('头部各部分：图标、标题、内容与关闭图标', async () => {
        const full = await renderOpen();
        expect(document.querySelector('.semi-popconfirm-header-icon')).toHaveAttribute('x-semi-prop', 'icon');
        expect(document.querySelector('.semi-popconfirm-header-icon svg')).not.toBeNull();
        expect(screen.getByText('确定是否要保存此修改？')).toHaveAttribute('x-semi-prop', 'title');
        expect(screen.getByText('此修改将不可逆')).toHaveAttribute('x-semi-prop', 'content');
        expect(screen.getByText('此修改将不可逆')).toHaveClass('semi-popconfirm-body', 'semi-popconfirm-body-withIcon');
        expect(document.querySelector('.semi-popconfirm-btn-close')).not.toBeNull();
        full.unmount();

        render(Popconfirm, {
            props: { defaultVisible: true, motion: false, showCloseIcon: false },
            slots: { default: () => <Button>{() => 'Save'}</Button>, icon: () => [] },
        });
        await cardShown();
        expect(document.querySelector('.semi-popconfirm-header-icon')).toBeNull();
        expect(document.querySelector('.semi-popconfirm-btn-close')).toBeNull();
        expect(document.querySelector('.semi-popconfirm-header-title')).toBeNull();
        expect(document.querySelector('.semi-popconfirm-body')).toBeNull();
    });

    it('title 属性渲染为标题并命名对话框，title 插槽优先', async () => {
        const view = await renderOpen({ title: '纯文本标题' }, { title: undefined });
        expect(screen.getByText('纯文本标题')).toHaveAttribute('x-semi-prop', 'title');
        await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleName('纯文本标题'));
        expect(document.querySelector('[title="纯文本标题"]')).toBeNull();
        view.unmount();

        await renderOpen({ title: '纯文本标题' });
        expect(screen.getByText('确定是否要保存此修改？')).toHaveAttribute('x-semi-prop', 'title');
        expect(screen.queryByText('纯文本标题')).toBeNull();
    });

    it('icon 插槽接受任意内容，缺省为警告图标', async () => {
        const custom = await renderOpen({}, { icon: () => '!' });
        expect(document.querySelector('.semi-popconfirm-header-icon')).toHaveTextContent('!');
        expect(document.querySelector('.semi-popconfirm-header-icon svg')).toBeNull();
        custom.unmount();
        await renderOpen({}, { icon: () => 1 });
        expect(document.querySelector('.semi-popconfirm-header-icon')).toHaveTextContent('1');
    });

    it('content 作用域插槽接收 initialFocusRef', async () => {
        const content = vi.fn<(props: { initialFocusRef: unknown }) => string>(() => 'fn content');
        await renderOpen({}, { content });
        expect(screen.getByText('fn content')).toBeInTheDocument();
        expect(isRef(content.mock.calls[0][0].initialFocusRef)).toBe(true);
    });

    it('class 与 style 作用于卡片，popover 外层获得 popconfirm-popover，其余属性丢弃', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(Popconfirm, {
            props: { defaultVisible: true, motion: false },
            attrs: { class: 'my-confirm', style: { width: '321px' }, 'data-extra': 'x', id: 'dropped', foo: 'bar' },
            slots: { default: () => <Button>{() => 'Save'}</Button>, title: () => 't' },
        });
        await cardShown();
        expect(card()).toHaveClass('my-confirm');
        expect(card()).toHaveStyle({ width: '321px' });
        const wrapper = document.querySelector('.semi-popover-wrapper');
        expect(wrapper).toHaveClass('semi-popconfirm-popover');
        expect(wrapper).not.toHaveClass('my-confirm');
        expect(document.querySelector('[data-extra]')).toBeNull();
        expect(document.querySelector('[foo]')).toBeNull();
        expect(document.querySelector('#dropped')).toBeNull();
        expect(warn.mock.calls.filter(([message]) => String(message).includes('Extraneous'))).toHaveLength(0);
        warn.mockRestore();
    });

    it('点击外部发出原生 MouseEvent 并关闭', async () => {
        expectTypeOf<PopconfirmEmits['clickOutSide']>().toEqualTypeOf<[event: MouseEvent]>();
        const view = renderPopconfirm();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await cardShown();
        await userEvent.click(document.body);
        const events = view.emitted<PopconfirmEmits['clickOutSide']>('clickOutSide');
        expect(events).toHaveLength(1);
        expect(events[0][0]).toBeInstanceOf(MouseEvent);
        expect(events[0][0]).not.toHaveProperty('nativeEvent');
        await waitFor(() => expect(card()).toBeNull());
    });

    it('默认 bottomLeft，RTL 下默认 bottomRight', async () => {
        const ltr = render(Popconfirm, {
            props: { defaultVisible: true, motion: false },
            slots: { default: () => <Button>{() => 'ltr'}</Button>, title: () => 't' },
        });
        const wrapper = () => document.querySelector('.semi-popover-wrapper');
        await waitFor(() => expect(wrapper()).toHaveAttribute('x-placement', 'bottomLeft'));
        ltr.unmount();
        render(ConfigProvider, {
            props: { direction: 'rtl' },
            slots: {
                default: () => (
                    <Popconfirm defaultVisible motion={false}>
                        {{
                            default: () => <Button>{() => 'rtl'}</Button>,
                            title: () => 't',
                        }}
                    </Popconfirm>
                ),
            },
        });
        await waitFor(() => expect(wrapper()).toHaveAttribute('x-placement', 'bottomRight'));
        expect(wrapper()).toHaveAttribute('dir', 'rtl');
    });

    it('单向 visible=false 点击只通知，父级同值更新保持关闭', async () => {
        const view = renderPopconfirm({ visible: false });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(card()).toBeNull();
        expect(view.emitted()['update:visible']).toEqual([[true]]);
        expect(view.emitted().visibleChange).toEqual([[true]]);
        await view.rerender({ visible: false });
        expect(card()).toBeNull();
        await view.rerender({ visible: true });
        await cardShown();
    });

    it('单向 visible=true 确认与取消保持打开并各发出一次关闭，rerender 后才关闭', async () => {
        const view = renderPopconfirm({ visible: true });
        await cardShown();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        expect(card()).not.toBeNull();
        expect(view.emitted<PopconfirmEmits['update:visible']>('update:visible').filter(([value]) => value === false)).toHaveLength(2);
        await view.rerender({ visible: false });
        await waitFor(() => expect(card()).toBeNull());
    });

    it('显式 visible: undefined 为非受控，受控值改回 undefined 后恢复点击交互', async () => {
        const view = renderPopconfirm({ visible: undefined });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await cardShown();
        await view.rerender({ visible: false });
        await waitFor(() => expect(card()).toBeNull());
        await view.rerender({ visible: undefined });
        await settle();
        expect(card()).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await cardShown();
    });

    it('单向 visible=true 确认后焦点留在弹层内，父级关闭后才回到触发元素', async () => {
        const view = renderPopconfirm({ visible: true });
        await cardShown();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await settle();
        expect(screen.getByRole('button', { name: 'Save' })).not.toHaveFocus();
        await view.rerender({ visible: false });
        await waitFor(() => expect(card()).toBeNull());
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    });

    it('受控 trigger=click 点击发出 update:visible，父级回写后打开', async () => {
        const view = renderPopconfirm({ visible: false, trigger: 'click' });
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(view.emitted()['update:visible']).toEqual([[true]]);
        await view.rerender({ visible: true });
        await cardShown();
    });

    it('程序化打开时 okButtonProps.autoFocus 聚焦确认按钮，程序化开合不发出 visibleChange，afterOpen 照常转发', async () => {
        const view = renderPopconfirm({ visible: false, okButtonProps: { autoFocus: true } });
        await view.rerender({ visible: true });
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        await waitFor(() => expect(view.emitted().afterOpen).toHaveLength(1));
        await view.rerender({ visible: false });
        await waitFor(() => expect(card()).toBeNull());
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
        expect(view.emitted().visibleChange).toBeUndefined();
        expect(view.emitted()['update:visible']).toBeUndefined();
    });

    it('读取 semiGlobal overrideDefaultProps，显式属性优先，函数 prop 经全局默认值调用', async () => {
        const onConfirm = vi.fn<() => void>();
        semiGlobal.config.overrideDefaultProps = {
            Popconfirm: { okText: 'Global OK', showCloseIcon: false, onConfirm },
        };
        const view = await renderOpen();
        expect(screen.getByRole('button', { name: 'Global OK' })).toBeInTheDocument();
        expect(document.querySelector('.semi-popconfirm-btn-close')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Global OK' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        view.unmount();

        await renderOpen({ okText: 'Own' });
        expect(screen.getByRole('button', { name: 'Own' })).toBeInTheDocument();
    });

    it('全局默认 trigger 生效', async () => {
        semiGlobal.config.overrideDefaultProps = { Popconfirm: { trigger: 'hover', mouseEnterDelay: 0 } };
        renderPopconfirm();
        await userEvent.hover(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('props 运行时：Boolean 类型都有 default 键，函数 prop 默认值为 undefined', () => {
        const declared = (Popconfirm as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props;
        const missingDefault = Object.entries(declared)
            .filter(([, option]) => [option.type].flat().includes(Boolean) && !('default' in option))
            .map(([key]) => key);
        expect(missingDefault).toEqual([]);
        expect(declared.onConfirm.default).toBeUndefined();
        expect(declared.onCancel.default).toBeUndefined();
    });

    it('focusTrigger 使触发元素获得焦点，disabled 时不做任何操作', async () => {
        const view = render(Handle);
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
        await view.rerender({ disabled: true });
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(screen.getByRole('button', { name: 'Save' })).not.toHaveFocus();
    });

    it('点击卡片内部不关闭', async () => {
        await renderOpen();
        await userEvent.click(screen.getByText('此修改将不可逆'));
        expect(card()).not.toBeNull();
    });

    it('stopPropagation=false 时卡片内的点击仍不到达 document 上的 click 监听', async () => {
        const documentClick = vi.fn<() => void>();
        document.addEventListener('click', documentClick);
        try {
            await renderOpen({ stopPropagation: false });
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

    it('关闭按钮名称从语言包读取', async () => {
        await renderOpen();
        expect(screen.getByRole('button', { name: zh_CN.Popconfirm.close })).toBeInTheDocument();
    });

    it('多节点默认插槽由 Tooltip 包 wrapper', () => {
        render(Popconfirm, {
            props: { motion: false },
            slots: {
                default: () => (
                    <>
                        <span>a</span>
                        <span>b</span>
                    </>
                ),
                title: () => 't',
            },
        });
        expect(screen.getByText('a').parentElement).toHaveClass('semi-tooltip-trigger-wrapper');
    });

    describe('对话框名称', () => {
        let warn: { mock: { calls: unknown[][] }; mockRestore: () => void };
        const nameWarnings = () => warn.mock.calls.filter(([message]) => String(message).includes('accessible name'));
        beforeEach(() => {
            warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        });
        afterEach(() => warn.mockRestore());

        it('标题作为对话框名称，内容作为描述', async () => {
            await renderOpen();
            const dialog = await screen.findByRole('dialog', { name: '确定是否要保存此修改？' });
            expect(dialog).toHaveAccessibleDescription('此修改将不可逆');
        });

        it('ariaDescribedby 取代内容描述', async () => {
            await renderOpen({ ariaDescribedby: 'note' });
            expect(await screen.findByRole('dialog')).toHaveAttribute('aria-describedby', 'note');
        });

        it('没有标题时，内容作为对话框名称，不再作描述', async () => {
            await renderOpen({}, { title: undefined });
            const dialog = await screen.findByRole('dialog', { name: '此修改将不可逆' });
            expect(dialog).not.toHaveAttribute('aria-describedby');
        });

        it('描述随标题的出现与消失同步', async () => {
            const view = render(Described, { props: { withTitle: true } });
            await cardShown();
            const dialog = await screen.findByRole('dialog', { name: '确定是否要保存此修改？' });
            expect(dialog).toHaveAccessibleDescription('此修改将不可逆');
            await view.rerender({ withTitle: false });
            expect(await screen.findByRole('dialog', { name: '此修改将不可逆' })).not.toHaveAttribute('aria-describedby');
            await view.rerender({ withTitle: true });
            await waitFor(() => expect(screen.getByRole('dialog')).toHaveAccessibleDescription('此修改将不可逆'));
        });

        it('空内容插槽不渲染内容区，也不作为名称', async () => {
            renderPopconfirm({ defaultVisible: true }, { title: undefined, content: () => '' });
            await cardShown();
            expect(document.querySelector('.semi-popconfirm-body')).toBeNull();
            expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
            expect(nameWarnings()).toHaveLength(1);
        });

        it('空标题不渲染，也不作为名称', async () => {
            await renderOpen({}, { title: () => '' });
            expect(document.querySelector('.semi-popconfirm-header-title')).toBeNull();
            expect(await screen.findByRole('dialog', { name: '此修改将不可逆' })).toBeInTheDocument();
        });

        it('用户设置的 ariaLabel 优先于标题', async () => {
            await renderOpen({ ariaLabel: 'Confirm saving' });
            expect(await screen.findByRole('dialog', { name: 'Confirm saving' })).toBeInTheDocument();
            expect(nameWarnings()).toHaveLength(0);
        });

        it('没有标题、内容或 ariaLabel 时只告警一次', async () => {
            renderPopconfirm({ defaultVisible: true }, { title: undefined, content: undefined });
            await screen.findByRole('dialog');
            await cardShown();
            expect(nameWarnings()).toHaveLength(1);
        });
    });

    it('打开中卸载时异步补调一次 afterClose', async () => {
        const afterClose = vi.fn<() => void>();
        const view = await renderOpen({ onAfterClose: afterClose });
        view.unmount();
        await nextTick();
        expect(afterClose).toHaveBeenCalledExactlyOnceWith();
    });

    it('content 里的点击不影响 Escape 关闭', async () => {
        const onContentClick = vi.fn<() => void>();
        render(ContentClick, { props: { onContentClick } });
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(await screen.findByText('此修改将不可逆'));
        expect(onContentClick).toHaveBeenCalledTimes(1);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBeNull());
    });

    it('content 作用域插槽的 initialFocusRef 获得初始焦点', async () => {
        render(ContentFocus);
        await userEvent.click(screen.getByRole('button', { name: '内容聚焦' }));
        await waitFor(() => expect(screen.getByPlaceholderText('focus here')).toHaveFocus());
    });

    it('按钮 autoFocus 与 initialFocusRef 同时指定时，点击打开后确认按钮获焦', async () => {
        render(ContentFocus, { props: { okAutoFocus: true } });
        await userEvent.click(screen.getByRole('button', { name: '内容聚焦' }));
        await cardShown();
        // Tooltip applies its initial focus in a timer after opening; give it time to (not) override the button.
        await settle(100);
        expect(screen.getByRole('button', { name: '确定' })).toHaveFocus();
    });

    it('卡片在 shadow root 内时，焦点已移到主文档的元素，关闭后不被拉回触发器', async () => {
        const outside = document.body.appendChild(document.createElement('button'));
        const host = document.body.appendChild(document.createElement('div'));
        const shadow = host.attachShadow({ mode: 'open' });
        const container = shadow.appendChild(document.createElement('div'));
        const view = render(Popconfirm, {
            container,
            props: { motion: false, trigger: 'click', visible: true },
            slots: { default: () => <Button>{() => 'Save'}</Button>, title: () => 't' },
        });
        await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).not.toBeNull());
        outside.focus();
        await view.rerender({ visible: false });
        await waitFor(() => expect(shadow.querySelector('[role="dialog"]')).toBeNull());
        expect(outside).toHaveFocus();
        view.unmount();
        outside.remove();
        host.remove();
    });

    it('类型：onConfirm 接受异步函数，content 插槽参数含 initialFocusRef', () => {
        const confirm: NonNullable<PopconfirmProps['onConfirm']> = async () => {};
        expect(confirm).toBeTypeOf('function');
        expectTypeOf<Parameters<NonNullable<PopconfirmSlots['content']>>[0]>().toHaveProperty('initialFocusRef');
    });
});
