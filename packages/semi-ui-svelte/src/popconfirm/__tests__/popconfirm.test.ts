import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { PopconfirmProps } from '../interface';
import PopconfirmFixture from './popconfirm-fixture.svelte';

type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';
type Store = {
    value?: boolean;
    accept: boolean;
    log: string[];
    shown: boolean;
    rtl: boolean;
    titleSnippet: boolean;
    content: 'none' | 'text' | 'input';
    icon: 'default' | 'none' | 'custom';
    props: Omit<PopconfirmProps, 'visible' | 'children' | 'child' | 'content' | 'icon'>;
};

const card = () => document.querySelector('.semi-popover .semi-popconfirm');
const footerButtons = () => document.querySelectorAll<HTMLElement>('.semi-popconfirm-footer button');
const cardShown = () => waitFor(() => expect(footerButtons()).toHaveLength(2));
const settle = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
const save = () => screen.getByRole('button', { name: 'Save' });
const changes = (store: Store) => store.log.filter((entry) => entry.startsWith('change'));

function deferred() {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function setup(props: Store['props'] = {}, { mode = 'uncontrolled' as Mode, ...init }: Partial<Omit<Store, 'props'>> & { mode?: Mode } = {}) {
    const store = createStore<Store>({
        accept: true,
        log: [],
        shown: true,
        rtl: false,
        titleSnippet: false,
        content: 'text',
        icon: 'default',
        ...init,
        props: { motion: false, position: 'bottomLeft', title: '确定是否要保存此修改？', ...props },
    });
    render(PopconfirmFixture, { props: { mode, store } });
    flushSync();
    return store;
}

async function setupOpen(props: Store['props'] = {}, init: Partial<Omit<Store, 'props'>> & { mode?: Mode } = {}) {
    const store = setup(props, { mode: 'one-way', value: true, ...init });
    await cardShown();
    return store;
}

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Popconfirm', () => {
    it('点击触发元素打开，标题在，onVisibleChange 通知 true', async () => {
        const store = setup();
        expect(card()).toBe(null);
        await userEvent.click(save());
        expect(await screen.findByText('确定是否要保存此修改？')).toBeInTheDocument();
        expect(card()).not.toBe(null);
        expect(changes(store)).toEqual(['change true']);
    });

    it('disabled 时不渲染卡片与触发属性，翻转后可打开', async () => {
        const store = setup({ disabled: true });
        expect(card()).toBe(null);
        expect(save()).not.toHaveAttribute('data-popupid');
        store.props = { ...store.props, disabled: false };
        flushSync();
        await userEvent.click(save());
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('打开状态下 disabled 翻为 true 卡片消失并报告关闭，翻回 false 后不自行弹出', async () => {
        const store = await setupOpen({}, { mode: 'bind' });
        store.props = { ...store.props, disabled: true };
        flushSync();
        await waitFor(() => expect(card()).toBe(null));
        expect(save()).toBeInTheDocument();
        expect(changes(store)).toEqual(['change false']);
        store.props = { ...store.props, disabled: false };
        flushSync();
        await settle(50);
        expect(card()).toBe(null);
    });

    it('bind:visible 双向：触发器、确认与 Escape 同步取值', async () => {
        const store = setup({}, { mode: 'bind', value: false });
        await userEvent.click(save());
        await cardShown();
        expect(store.value).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(card()).toBe(null));
        expect(store.value).toBe(false);
        await userEvent.click(save());
        await cardShown();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBe(null));
        expect(store.value).toBe(false);
    });

    it('trigger=custom 只跟随绑定值', async () => {
        const store = setup({ trigger: 'custom' }, { mode: 'bind', value: false });
        await userEvent.click(save());
        expect(card()).toBe(null);
        store.value = true;
        await cardShown();
        store.value = false;
        await waitFor(() => expect(card()).toBe(null));
    });

    it('取消按钮：onCancel 一次，onConfirm 零次，关闭', async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        await setupOpen({ onCancel, onConfirm });
        await userEvent.click(footerButtons()[0]);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
        await waitFor(() => expect(footerButtons()).toHaveLength(0));
    });

    it('确认按钮：onConfirm 一次，onCancel 零次，关闭，onVisibleChange 只报一次关闭', async () => {
        const onCancel = vi.fn<() => void>();
        const onConfirm = vi.fn<() => void>();
        const store = await setupOpen({ onCancel, onConfirm });
        await userEvent.click(footerButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
        await waitFor(() => expect(footerButtons()).toHaveLength(0));
        await settle();
        expect(changes(store)).toEqual(['change false']);
    });

    it('onConfirm 返回 Promise 时显示 loading，resolve 后关闭', async () => {
        const confirm = deferred();
        await setupOpen({ onConfirm: () => confirm.promise });
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await waitFor(() => expect(footerButtons()[1]).toHaveClass('semi-button-loading'));
        expect(card()).not.toBe(null);
        confirm.resolve();
        await waitFor(() => expect(card()).toBe(null));
    });

    it('onCancel 返回 rejected Promise 时停止 loading，保持打开', async () => {
        const cancel = deferred();
        await setupOpen({ onCancel: () => cancel.promise });
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await waitFor(() => expect(footerButtons()[0]).toHaveClass('semi-button-loading'));
        cancel.reject(new Error('no'));
        await waitFor(() => expect(footerButtons()[0]).not.toHaveClass('semi-button-loading'));
        expect(card()).not.toBe(null);
    });

    it('onCancel 挂起期间再次点击关闭图标不重复调用', async () => {
        const cancel = deferred();
        const onCancel = vi.fn<() => Promise<void>>(() => cancel.promise);
        await setupOpen({ onCancel });
        const close = screen.getByRole('button', { name: zh_CN.Popconfirm.close });
        await userEvent.click(close);
        await userEvent.click(close);
        expect(onCancel).toHaveBeenCalledTimes(1);
        cancel.resolve();
        await waitFor(() => expect(card()).toBe(null));
    });

    it('挂起期间重新打开的弹层不会被旧的 Promise 关掉', async () => {
        const pending = deferred();
        setup({ onConfirm: () => pending.promise });
        await userEvent.click(save());
        await cardShown();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBe(null));
        await userEvent.click(save());
        await cardShown();
        pending.resolve();
        await settle(100);
        expect(card()).not.toBe(null);
    });

    it('Escape 关闭弹层并通知 onEscKeyDown，确认按钮 autoFocus 生效', async () => {
        const store = setup({ okButtonProps: { autoFocus: true } });
        await userEvent.click(save());
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBe(null));
        expect(store.log.filter((entry) => entry.startsWith('esc'))).toEqual(['esc true']);
    });

    it.each([
        ['confirm', '确定'],
        ['cancel', '取消'],
    ])('%s 之后焦点回到触发元素', async (_, name) => {
        setup();
        await userEvent.click(save());
        await userEvent.click(await screen.findByRole('button', { name }));
        await waitFor(() => expect(card()).toBe(null));
        expect(save()).toHaveFocus();
    });

    it('关闭图标调用 onCancel，并把焦点还给触发元素', async () => {
        const onCancel = vi.fn<() => void>();
        setup({ onCancel });
        await userEvent.click(save());
        await userEvent.click(await screen.findByRole('button', { name: zh_CN.Popconfirm.close }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(card()).toBe(null));
        expect(save()).toHaveFocus();
    });

    it('设置了 okText、cancelText 时替换语言包文本', async () => {
        await setupOpen({ okText: 'Go', cancelText: 'Stop' });
        expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    });

    it('okType、cancelType 与按钮属性传给底部按钮，autoFocus 不落到 DOM', async () => {
        await setupOpen({ okType: 'danger', cancelButtonProps: { class: 'my-cancel', disabled: true, autoFocus: true }, okButtonProps: { class: 'my-ok' } });
        const [cancel, ok] = footerButtons();
        expect(cancel).toHaveClass('semi-button-tertiary-disabled', 'my-cancel');
        expect(cancel).toBeDisabled();
        expect(cancel).not.toHaveAttribute('autofocus');
        expect(cancel).toHaveAttribute('data-type', 'cancel');
        expect(ok).toHaveClass('semi-button-danger', 'my-ok');
        expect(ok).toHaveAttribute('data-type', 'ok');
    });

    it('按钮属性里的 loading: false 不取消挂起期间的 loading 与重入保护', async () => {
        const confirm = deferred();
        const onConfirm = vi.fn<() => Promise<void>>(() => confirm.promise);
        await setupOpen({ onConfirm, okButtonProps: { loading: false } });
        await userEvent.click(footerButtons()[1]);
        await waitFor(() => expect(footerButtons()[1]).toHaveClass('semi-button-loading'));
        await userEvent.click(footerButtons()[1]);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        confirm.resolve();
        await waitFor(() => expect(card()).toBe(null));
    });

    it('okButtonProps.onclick 追加调用，确认流程不丢，onConfirm 收到原生 MouseEvent', async () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const onConfirm = vi.fn<(event: MouseEvent) => void>();
        await setupOpen({ onConfirm, okButtonProps: { onclick } });
        await userEvent.click(footerButtons()[1]);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
        await waitFor(() => expect(card()).toBe(null));
    });

    it('头部各部分：图标、标题、内容与关闭图标', async () => {
        await setupOpen();
        expect(document.querySelector('.semi-popconfirm-header-icon')).toHaveAttribute('x-semi-prop', 'icon');
        expect(document.querySelector('.semi-popconfirm-header-icon svg')).not.toBe(null);
        expect(screen.getByText('确定是否要保存此修改？')).toHaveAttribute('x-semi-prop', 'title');
        const body = screen.getByText('此修改将不可逆').parentElement;
        expect(body).toHaveAttribute('x-semi-prop', 'content');
        expect(body).toHaveClass('semi-popconfirm-body', 'semi-popconfirm-body-withIcon');
        expect(document.querySelector('.semi-popconfirm-btn-close')).not.toBe(null);
    });

    it('icon=null、无标题与内容、showCloseIcon=false 时对应部分不渲染', async () => {
        await setupOpen({ showCloseIcon: false, title: undefined, 'aria-label': 'Delete' }, { icon: 'none', content: 'none' });
        expect(document.querySelector('.semi-popconfirm-header-icon')).toBe(null);
        expect(document.querySelector('.semi-popconfirm-btn-close')).toBe(null);
        expect(document.querySelector('.semi-popconfirm-header-title')).toBe(null);
        expect(document.querySelector('.semi-popconfirm-body')).toBe(null);
    });

    it('icon 与 title 接受 snippet', async () => {
        await setupOpen({}, { icon: 'custom', titleSnippet: true });
        expect(screen.getByTestId('custom-icon').closest('.semi-popconfirm-header-icon')).not.toBe(null);
        expect(document.querySelector('.semi-popconfirm-header-icon svg')).toBe(null);
        expect(screen.getByRole('dialog', { name: 'snippet title' })).toBeInTheDocument();
    });

    it('class 与 style 作用于卡片，弹层获得 popconfirm-popover', async () => {
        await setupOpen({ class: 'my-confirm', style: 'width: 321px' });
        expect(card()).toHaveClass('my-confirm');
        expect(card()).toHaveStyle({ width: '321px' });
        const wrapper = document.querySelector('.semi-popover-wrapper');
        expect(wrapper).toHaveClass('semi-popconfirm-popover');
        expect(wrapper).not.toHaveClass('my-confirm');
    });

    it('点击外部通知原生 MouseEvent 并关闭', async () => {
        const store = setup();
        await userEvent.click(save());
        await cardShown();
        await userEvent.click(document.body);
        expect(store.log.filter((entry) => entry.startsWith('outside'))).toEqual(['outside true']);
        await waitFor(() => expect(card()).toBe(null));
    });

    it('默认 bottomLeft，RTL 下默认 bottomRight', async () => {
        const store = await setupOpen({ position: undefined });
        const wrapper = () => document.querySelector('.semi-popover-wrapper');
        expect(wrapper()).toHaveAttribute('x-placement', 'bottomLeft');
        store.shown = false;
        flushSync();
        store.rtl = true;
        store.shown = true;
        flushSync();
        await waitFor(() => expect(wrapper()).toHaveAttribute('x-placement', 'bottomRight'));
        expect(wrapper()).toHaveAttribute('dir', 'rtl');
    });

    it('函数绑定拒绝打开：点击只通知，父级改值后打开', async () => {
        const store = setup({}, { mode: 'function', value: false, accept: false });
        await userEvent.click(save());
        expect(card()).toBe(null);
        expect(store.log).toEqual(['set true', 'change true']);
        store.value = true;
        await cardShown();
    });

    it('函数绑定拒绝关闭：确认与取消保持打开并各通知一次关闭，焦点在父级关闭后回到触发元素', async () => {
        const store = setup({}, { mode: 'function', value: true, accept: false });
        await cardShown();
        await userEvent.click(screen.getByRole('button', { name: '确定' }));
        await userEvent.click(screen.getByRole('button', { name: '取消' }));
        await settle();
        expect(card()).not.toBe(null);
        expect(save()).not.toHaveFocus();
        expect(changes(store)).toEqual(['change false', 'change false']);
        store.value = false;
        await waitFor(() => expect(card()).toBe(null));
        expect(save()).toHaveFocus();
    });

    it('绑定值改回 undefined 后恢复点击交互', async () => {
        const store = setup({}, { mode: 'bind', value: undefined });
        await userEvent.click(save());
        await cardShown();
        store.value = false;
        await waitFor(() => expect(card()).toBe(null));
        store.value = undefined;
        await settle();
        expect(card()).toBe(null);
        await userEvent.click(save());
        await cardShown();
    });

    it('程序化打开时 okButtonProps.autoFocus 聚焦确认按钮，程序化开合不通知 onVisibleChange，afterOpen 照常转发', async () => {
        const store = setup({ okButtonProps: { autoFocus: true } }, { mode: 'bind', value: false });
        store.value = true;
        await waitFor(() => expect(screen.getByRole('button', { name: '确定' })).toHaveFocus());
        await waitFor(() => expect(store.log).toContain('afterOpen'));
        store.value = false;
        await waitFor(() => expect(card()).toBe(null));
        expect(save()).toHaveFocus();
        expect(changes(store)).toEqual([]);
    });

    it('读取全局默认值，显式属性优先，函数 prop 经全局默认值调用', async () => {
        const onConfirm = vi.fn<() => void>();
        semiGlobal.config = { overrideDefaultProps: { Popconfirm: { okText: 'Global OK', showCloseIcon: false, onConfirm } } };
        const store = await setupOpen();
        expect(document.querySelector('.semi-popconfirm-btn-close')).toBe(null);
        await userEvent.click(screen.getByRole('button', { name: 'Global OK' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        store.shown = false;
        flushSync();
        store.props = { ...store.props, okText: 'Own' };
        store.value = true;
        store.shown = true;
        flushSync();
        await cardShown();
        expect(screen.getByRole('button', { name: 'Own' })).toBeInTheDocument();
    });

    it('全局默认 trigger 生效，hover 时仍是以标题命名的对话框', async () => {
        semiGlobal.config = { overrideDefaultProps: { Popconfirm: { trigger: 'hover', mouseEnterDelay: 0 } } };
        setup();
        await userEvent.hover(save());
        expect(await screen.findByRole('dialog', { name: '确定是否要保存此修改？' })).toBeInTheDocument();
        expect(save()).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('focusTrigger 使触发元素获得焦点，disabled 时不做任何操作', async () => {
        const store = setup();
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(save()).toHaveFocus();
        store.props = { ...store.props, disabled: true };
        flushSync();
        screen.getByLabelText('outside').focus();
        await fireEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(save()).not.toHaveFocus();
    });

    it('点击卡片内部不关闭，默认 stopPropagation 时不到达 document 的 click 监听', async () => {
        const documentClick = vi.fn<() => void>();
        await setupOpen();
        // Svelte registers its delegated listener on mount; a document listener added earlier would still see the click
        document.addEventListener('click', documentClick);
        onTestFinished(() => document.removeEventListener('click', documentClick));
        await userEvent.click(screen.getByText('此修改将不可逆'));
        expect(card()).not.toBe(null);
        expect(documentClick).not.toHaveBeenCalled();
    });

    it('content 里的点击不影响 Escape 关闭', async () => {
        setup();
        await userEvent.click(save());
        await userEvent.click(await screen.findByText('此修改将不可逆'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(card()).toBe(null));
    });

    it('content 的 initialFocusRef 获得初始焦点', async () => {
        setup({}, { content: 'input' });
        await userEvent.click(save());
        await waitFor(() => expect(screen.getByPlaceholderText('focus here')).toHaveFocus());
    });

    it('按钮 autoFocus 与 initialFocusRef 同时指定时，点击打开后确认按钮获焦', async () => {
        setup({ okButtonProps: { autoFocus: true } }, { content: 'input' });
        await userEvent.click(save());
        await cardShown();
        // Tooltip applies its initial focus in a timer after opening; give it time to (not) override the button
        await settle(100);
        expect(screen.getByRole('button', { name: '确定' })).toHaveFocus();
    });

    it('打开中卸载时补调一次 afterClose', async () => {
        const store = await setupOpen();
        store.shown = false;
        flushSync();
        expect(store.log.filter((entry) => entry === 'afterClose')).toHaveLength(1);
    });

    describe('对话框名称', () => {
        const nameWarnings = (warn: { mock: { calls: unknown[][] } }) => warn.mock.calls.filter(([message]) => String(message).includes('accessible name'));
        const spyWarn = () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            onTestFinished(() => warn.mockRestore());
            return warn;
        };

        it('标题作为对话框名称，内容作为描述', async () => {
            await setupOpen();
            expect(screen.getByRole('dialog', { name: '确定是否要保存此修改？' })).toHaveAccessibleDescription('此修改将不可逆');
        });

        it('aria-describedby 取代内容描述', async () => {
            await setupOpen({ 'aria-describedby': 'note' });
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'note');
        });

        it('没有标题时，内容作为对话框名称，不再作描述', async () => {
            await setupOpen({ title: undefined });
            expect(screen.getByRole('dialog', { name: '此修改将不可逆' })).not.toHaveAttribute('aria-describedby');
        });

        it('描述随标题的出现与消失同步', async () => {
            const store = await setupOpen();
            expect(screen.getByRole('dialog', { name: '确定是否要保存此修改？' })).toHaveAccessibleDescription('此修改将不可逆');
            store.props = { ...store.props, title: undefined };
            flushSync();
            expect(screen.getByRole('dialog', { name: '此修改将不可逆' })).not.toHaveAttribute('aria-describedby');
            store.props = { ...store.props, title: '确定是否要保存此修改？' };
            flushSync();
            expect(screen.getByRole('dialog')).toHaveAccessibleDescription('此修改将不可逆');
        });

        it('空字符串标题不渲染，也不作为名称', async () => {
            await setupOpen({ title: '' });
            expect(document.querySelector('.semi-popconfirm-header-title')).toBe(null);
            expect(screen.getByRole('dialog', { name: '此修改将不可逆' })).toBeInTheDocument();
        });

        it('用户设置的 aria-label 优先于标题', async () => {
            const warn = spyWarn();
            await setupOpen({ 'aria-label': 'Confirm saving' });
            expect(screen.getByRole('dialog', { name: 'Confirm saving' })).toBeInTheDocument();
            expect(nameWarnings(warn)).toHaveLength(0);
        });

        it('没有标题、内容或 aria-label 时只告警一次', async () => {
            const warn = spyWarn();
            await setupOpen({ title: undefined }, { content: 'none' });
            expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
            expect(nameWarnings(warn)).toHaveLength(1);
        });
    });
});
