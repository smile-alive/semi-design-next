import { batch, createSignal, Show, type JSX } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconWifi } from '@fibrae/semi-icons-solid';
import Toast, { ToastFactory, type ToastHookApi, type ToastProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import { LocaleProvider } from '../../locale';
import ToastItem from '../toast';

const prefix = `${BASE_CLASS_PREFIX}-toast`;
const hideCls = `${prefix}-animation-hide`;
const getInfoToast = () => document.querySelector<HTMLElement>(`.${prefix}-info`);
const getList = () => document.querySelector<HTMLElement>(`.${prefix}-innerWrapper`) as HTMLElement;
const endLeave = (scope: ParentNode = document) => scope.querySelectorAll(`.${hideCls}`).forEach((toast) => toast.dispatchEvent(new Event('animationend', { bubbles: true })));

let api: ToastHookApi;
function HookHost() {
    const [toast, contextHolder] = Toast.useToast();
    api = toast;
    return <div data-testid="holder">{contextHolder}</div>;
}

describe('Toast', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so Toast timers follow the real clock
        vi.useRealTimers();
        // jsdom runs no animation; report one so the list waits for the animationend the tests dispatch
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'show' } as unknown as Animation]);
    });
    afterEach(async () => {
        Toast.destroyAll();
        Toast.resetConfig();
        semiGlobal.config.overrideDefaultProps = {};
        vi.useRealTimers();
        // the detached tree is released in a microtask
        await Promise.resolve();
    });

    it('基础展示 Toast 及其内容', () => {
        Toast.info('semi');
        expect(getInfoToast()).toHaveTextContent(/^semi$/);
    });

    it('theme: light 主题', () => {
        Toast.info({ content: 'semi', theme: 'light' });
        expect(getInfoToast()).toHaveClass(`${prefix}-light`);
    });

    it('duration 大于 0', () => {
        vi.useFakeTimers();
        Toast.info({ duration: 1, content: 'dur1', motion: false });
        expect(getInfoToast()).toHaveTextContent(/^dur1$/);
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toBeNull();
    });

    it('显式传入 undefined 的 duration 等同未传，沿用 Toast.config 的值', () => {
        vi.useFakeTimers();
        Toast.config({ duration: 10 });
        Toast.info({ content: 'configured', duration: undefined, motion: false });
        vi.advanceTimersByTime(3500);
        expect(getInfoToast()).toHaveTextContent(/^configured$/);
        vi.advanceTimersByTime(7000);
        expect(getInfoToast()).toBeNull();
    });

    it('按 id 更新内容', () => {
        vi.useFakeTimers();
        const id = 'toastid';
        Toast.info({ content: 'bytedance', id, motion: false });
        const toast = getInfoToast();
        expect(toast).toHaveTextContent(/^bytedance$/);
        vi.advanceTimersByTime(1000);
        Toast.info({ content: 'dancebyte', id, motion: false });
        expect(toast).toHaveTextContent(/^dancebyte$/);
        vi.advanceTimersByTime(1000);
        Toast.error({ content: 'error', id, motion: false });
        expect(toast).toHaveTextContent(/^error$/);
        expect(toast?.className).toEqual(`${prefix} ${prefix}-error`);
    });

    it('duration 后触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Toast.info({ onClose, content: 'bytedance', duration: 0.8 });
        vi.advanceTimersByTime(799);
        expect(onClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('手动关闭后计时器不再触发第二次 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Toast.info({ onClose, content: 'bytedance', duration: 1 });
        vi.advanceTimersByTime(500);
        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('点击关闭按钮时触发 onClose', async () => {
        const onClose = vi.fn<() => void>();
        render(() => <ToastItem content="bytedance" onClose={onClose} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('onClose 显式为 null 时点击关闭按钮不抛错', async () => {
        // an untyped caller may pass null
        render(() => <ToastItem content="bytedance" onClose={null as unknown as () => void} />);
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByText('bytedance')).toBeInTheDocument();
    });

    it('showClose = false', () => {
        const { container } = render(() => <ToastItem content="showCloseToast" duration={1} showClose={false} />);
        expect(container.querySelector(`.${prefix}-close-button`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('自定义图标替换类型图标，自带的尺寸保留', () => {
        const { container } = render(() => <ToastItem type="info" content="semi" icon={<IconWifi class="mine" size="small" />} />);
        const icon = container.querySelector(`.${BASE_CLASS_PREFIX}-icon-wifi`);
        expect(icon).toHaveClass('mine', `${BASE_CLASS_PREFIX}-icon-small`);
        expect(container.querySelector(`.${prefix}-icon-info`)).toBeNull();
    });

    it('未指定尺寸的 Semi 图标按 large 渲染', () => {
        const { container } = render(() => <ToastItem type="info" content="semi" icon={<IconWifi />} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-wifi`)).toHaveClass(`${BASE_CLASS_PREFIX}-icon-large`);
    });

    it('指定 getPopupContainer', () => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        const ContainerToast = ToastFactory.create({ getPopupContainer: () => container });
        ContainerToast.info('specific getPopupContainer');
        expect(document.getElementById(ContainerToast.getWrapperId() as string)?.parentNode).toBe(container);
        expect(container).toHaveTextContent('specific getPopupContainer');
        ContainerToast.destroyAll();
        container.remove();
    });

    it('resetConfig 恢复内置默认值', () => {
        Toast.config({ top: '400px', theme: 'light', zIndex: 2333, duration: 0 });
        Toast.resetConfig();
        Toast.info('semi');
        const wrapper = document.getElementById(Toast.getWrapperId() as string) as HTMLElement;
        expect(wrapper).toHaveStyle({ zIndex: '1010' });
        expect(wrapper.style.top).toBe('');
        expect(getInfoToast()).not.toHaveClass(`${prefix}-light`);
        expect(Toast.defaultOpts.duration).toBeUndefined();
    });

    it('config({ top: undefined }) 清除容器上已有的 top', () => {
        Toast.config({ top: 10 });
        Toast.info('first');
        const wrapper = document.getElementById(Toast.getWrapperId() as string) as HTMLElement;
        expect(wrapper.style.top).toBe('10px');
        Toast.config({ top: undefined });
        Toast.info('second');
        expect(wrapper.style.top).toBe('');
    });

    it('ToastFactory 实例上的 resetConfig 恢复其创建时的配置', () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000, duration: 5 });
        Other.config({ top: 10, zIndex: 4000, duration: 9 });
        Other.resetConfig();
        expect(Other.defaultOpts).toMatchObject({ top: 77, zIndex: 3000, duration: 5 });
        Other.info('other');
        expect(document.getElementById(Other.getWrapperId() as string)).toHaveStyle({ top: '77px', zIndex: '3000' });
        Other.destroyAll();
    });

    it('同一批次中的所有 Toast 都保持显示', () => {
        Toast.info('first');
        batch(() => {
            Toast.info('second');
            Toast.info({ id: 'same', content: 'v1' });
            Toast.info({ id: 'same', content: 'v2' });
        });
        expect([...document.querySelectorAll(`.${prefix}-info`)].map((toast) => toast.textContent)).toEqual(['first', 'second', 'v2']);
    });

    it('同一批次中关闭的 Toast 都播放离场动画', () => {
        const getToasts = () => [...document.querySelectorAll(`.${prefix}-info`)];
        Toast.info({ id: 'a', content: 'a', duration: 0 });
        Toast.info({ id: 'b', content: 'b', duration: 0 });
        Toast.close('a');
        Toast.close('b');
        expect(getToasts().map((toast) => [toast.textContent, toast.classList.contains(hideCls)])).toEqual([
            ['a', true],
            ['b', true],
        ]);
        Toast.info({ id: 'c', content: 'c', duration: 0 });
        expect(getToasts().map((toast) => toast.textContent)).toEqual(['a', 'b', 'c']);
        endLeave();
        expect(getToasts().map((toast) => toast.textContent)).toEqual(['c']);
    });

    it('渲染各类型的类名和图标，没有 type 的 Toast 不显示图标', () => {
        const types = ['info', 'success', 'warning', 'error'] as const;
        types.forEach((type) => Toast[type]({ content: type, duration: 0 }));
        Toast.create({ content: 'plain', duration: 0 });
        for (const type of types) {
            const toast = screen.getByLabelText(zh_CN.Toast[type]);
            expect(toast).toHaveClass(prefix, `${prefix}-${type}`);
            expect(toast.querySelector(`.${prefix}-icon-${type}`)).not.toBeNull();
        }
        const plain = screen.getByLabelText(zh_CN.Toast.default);
        expect(plain).toHaveTextContent(/^plain$/);
        expect(plain.querySelector(`.${prefix}-icon`)).toBeNull();
    });

    it('悬停时暂停关闭计时器', () => {
        vi.useFakeTimers();
        Toast.info({ content: 'hover', duration: 1, motion: false });
        vi.advanceTimersByTime(500);
        fireEvent.mouseEnter(getList());
        vi.advanceTimersByTime(2000);
        expect(getInfoToast()).not.toBeNull();
        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toBeNull();
    });

    it('焦点在列表内时暂停关闭计时器，焦点离开后重新计时', () => {
        vi.useFakeTimers();
        Toast.info({ content: 'focus', duration: 1, motion: false });
        const close = screen.getByRole('button', { name: zh_CN.Toast.close });
        close.focus();
        vi.advanceTimersByTime(2000);
        expect(getInfoToast()).not.toBeNull();
        close.blur();
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toBeNull();
    });

    it('悬停期间新来的 Toast 同样暂停', () => {
        vi.useFakeTimers();
        Toast.info({ content: 'first', duration: 1, motion: false });
        fireEvent.mouseEnter(getList());
        Toast.success({ content: 'second', duration: 1, motion: false });
        vi.advanceTimersByTime(5000);
        expect(document.querySelectorAll(`.${prefix}`)).toHaveLength(2);
        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(1000);
        expect(document.querySelectorAll(`.${prefix}`)).toHaveLength(0);
    });

    it('Toast.close 进入离场后，剩余计时到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Toast.info({ id: 'leaving', content: 'leaving', duration: 1, onClose });
        vi.advanceTimersByTime(900);
        Toast.close('leaving');
        expect(getInfoToast()).toHaveClass(hideCls);
        vi.advanceTimersByTime(200);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('contextHolder 移出再放回时，离场中的 Toast 不计时，到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const [shown, setShown] = createSignal(true);
        function Host() {
            const [toast, contextHolder] = Toast.useToast();
            api = toast;
            return <Show when={shown()}>{contextHolder}</Show>;
        }
        render(() => <Host />);
        api.close(api.info({ content: 'leftover', duration: 1, onClose }));
        setShown(false);
        setShown(true);
        expect(getInfoToast()).toHaveClass(hideCls);
        vi.advanceTimersByTime(2000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('每次调用都应用 zIndex', () => {
        Toast.info('a');
        Toast.info({ content: 'b', zIndex: 2000 });
        expect(document.getElementById(Toast.getWrapperId() as string)).toHaveStyle({ zIndex: '2000' });
    });

    it('info、success 与无 type 的 Toast 为 status，warning、error 为 alert', () => {
        (['info', 'success', 'warning', 'error'] as const).forEach((type) => Toast[type]({ content: type, duration: 0 }));
        Toast.create({ content: 'plain', duration: 0 });
        expect(screen.getByRole('status', { name: zh_CN.Toast.info })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: zh_CN.Toast.success })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: zh_CN.Toast.default })).toBeInTheDocument();
        expect(screen.getByRole('alert', { name: zh_CN.Toast.warning })).toBeInTheDocument();
        expect(screen.getByRole('alert', { name: zh_CN.Toast.error })).toBeInTheDocument();
    });

    it('duration 为 0 时不会自动关闭', () => {
        vi.useFakeTimers();
        Toast.info({ content: 'stay', duration: 0, motion: false });
        vi.advanceTimersByTime(60_000);
        expect(getInfoToast()).toHaveTextContent(/^stay$/);
    });

    it('关闭按钮只触发一次 onClose，Toast.close 不触发', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Toast.info({ id: 'btn', content: 'btn', duration: 1, motion: false, onClose });
        fireEvent.click(getInfoToast()?.querySelector('button') as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getInfoToast()).toBeNull();
        vi.advanceTimersByTime(2000);
        expect(onClose).toHaveBeenCalledTimes(1);

        const onManualClose = vi.fn<() => void>();
        Toast.info({ id: 'manual', content: 'manual', duration: 1, motion: false, onClose: onManualClose });
        Toast.close('manual');
        expect(getInfoToast()).toBeNull();
        vi.advanceTimersByTime(2000);
        expect(onManualClose).not.toHaveBeenCalled();
    });

    it('离场动画期间再次点击关闭按钮，onClose 只触发一次', () => {
        const onClose = vi.fn<() => void>();
        Toast.info({ content: 'twice', duration: 0, onClose });
        const button = getInfoToast()?.querySelector('button') as HTMLElement;
        fireEvent.click(button);
        expect(getInfoToast()).toHaveClass(hideCls);
        fireEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('页面取消了动画时，离场立即结束', () => {
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([]);
        Toast.info({ id: 'none', content: 'none', duration: 0 });
        Toast.close('none');
        expect(getInfoToast()).toBeNull();
    });

    it('ToastFactory 实例各自保留容器和配置', () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000 });
        Toast.info({ content: 'main', duration: 0 });
        Other.info({ content: 'other', duration: 0 });
        const main = document.getElementById(Toast.getWrapperId() as string) as HTMLElement;
        const other = document.getElementById(Other.getWrapperId() as string) as HTMLElement;
        expect(main).not.toBe(other);
        expect(main).toHaveStyle({ zIndex: '1010' });
        expect(main.style.top).toBe('');
        expect(other).toHaveStyle({ top: '77px', zIndex: '3000' });
        expect(main).toHaveTextContent(/^main$/);
        expect(other).toHaveTextContent(/^other$/);
        Other.destroyAll();
        expect(other.isConnected).toBe(false);
        expect(Other.getWrapperId()).toBeNull();
        expect(main).toHaveTextContent(/^main$/);
    });

    it('useToast 在 contextHolder 中渲染 Toast，并按 id 关闭', () => {
        render(() => <HookHost />);
        const id = api.success({ content: 'hook', duration: 0 });
        api.info({ content: 'hook2', duration: 0 });
        const holder = screen.getByTestId('holder');
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(2);
        expect(holder.querySelector(`.${prefix}-success`)).toHaveTextContent(/^hook$/);
        expect(document.querySelector(`.${prefix}-wrapper`)?.parentElement).toBe(holder);
        api.close(id);
        expect(holder.querySelector(`.${prefix}-success`)).toHaveClass(hideCls);
        endLeave(holder);
        expect(holder.querySelector(`.${prefix}-success`)).toBeNull();
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(1);
    });

    it('useToast 传入 undefined 的 duration 不覆盖默认值，Toast 会自动关闭', () => {
        vi.useFakeTimers();
        render(() => <HookHost />);
        api.info({ content: 'auto', duration: undefined, motion: false });
        const holder = screen.getByTestId('holder');
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(1);
        vi.advanceTimersByTime(3000);
        expect(holder.querySelectorAll(`.${prefix}`)).toHaveLength(0);
    });

    it('useToast 的 Toast 读取调用处的 LocaleProvider 与 ConfigProvider，静态方法读取默认值', () => {
        render(() => (
            <ConfigProvider direction="rtl">
                <LocaleProvider locale={en_US}>
                    <HookHost />
                </LocaleProvider>
            </ConfigProvider>
        ));
        api.info({ content: 'hook', duration: 0 });
        Toast.success({ content: 'static', duration: 0 });
        const hooked = screen.getByRole('status', { name: en_US.Toast.info });
        expect(hooked).toHaveAttribute('dir', 'rtl');
        expect(hooked.querySelector('button')).toHaveAccessibleName(en_US.Toast.close);
        const staticToast = screen.getByRole('status', { name: zh_CN.Toast.success });
        expect(staticToast).not.toHaveAttribute('dir');
        expect(staticToast.querySelector('button')).toHaveAccessibleName(zh_CN.Toast.close);
    });

    it('卸载 useToast 的调用方时清除 Toast 的计时器', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const { unmount } = render(() => <HookHost />);
        api.info({ content: 'gone', duration: 1, onClose });
        unmount();
        vi.advanceTimersByTime(2000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('useToast 的类型：返回 [api, contextHolder] 元组，api 参数与静态方法一致', () => {
        type UseToastReturn = ReturnType<typeof Toast.useToast>;
        type Options = Omit<ToastProps, 'type' | 'close' | 'id' | 'zIndex' | 'getPopupContainer'>;
        expectTypeOf<UseToastReturn>().toEqualTypeOf<[ToastHookApi, JSX.Element]>();
        for (const method of ['success', 'info', 'error', 'warning', 'open'] as const) {
            expectTypeOf<Parameters<ToastHookApi[typeof method]>>().toEqualTypeOf<[Options]>();
        }
        expectTypeOf<ToastHookApi['close']>().toEqualTypeOf<(id: string) => void>();
        expectTypeOf<Options>().not.toHaveProperty('id');
        expectTypeOf<Options>().not.toHaveProperty('zIndex');
        expectTypeOf<Options>().not.toHaveProperty('getPopupContainer');
    });

    it('静态方法与 hook 的选项类型不含由列表提供的 close，接受 data-*、aria-* 与 dir', () => {
        type StaticOptions = Exclude<Parameters<typeof Toast.info>[0], string>;
        expectTypeOf<StaticOptions>().not.toHaveProperty('close');
        expectTypeOf<StaticOptions>().not.toHaveProperty('type');
        expectTypeOf<StaticOptions>().toHaveProperty('zIndex');
        expectTypeOf({ content: 'a', 'data-testid': 'x', 'aria-describedby': 'y', dir: 'rtl' as const }).toExtend<StaticOptions>();
        expectTypeOf({ content: 'a', 'data-testid': 'x' }).toExtend<Parameters<ToastHookApi['info']>[0]>();
    });

    it('读取 semiGlobal overrideDefaultProps.Toast 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Toast: { theme: 'light', showClose: false, top: 12 } };
        Toast.info({ content: 'global', duration: 0 });
        expect(getInfoToast()).toHaveClass(`${prefix}-light`);
        expect(getInfoToast()?.querySelector('button')).toBeNull();
        expect(document.getElementById(Toast.getWrapperId() as string)).toHaveStyle({ top: '12px' });
        Toast.success({ content: 'own', duration: 0, theme: 'normal', showClose: true });
        const own = document.querySelector(`.${prefix}-success`);
        expect(own).not.toHaveClass(`${prefix}-light`);
        expect(own?.querySelector('button')).not.toBeNull();
        const { container } = render(() => <ToastItem content="item" />);
        expect(container.querySelector('button')).toBeNull();
    });

    it('全局默认值里的 id 不生效，每条 toast 的 id 各不相同', () => {
        // an untyped caller may still put an instance id into the global config
        semiGlobal.config.overrideDefaultProps = { Toast: { id: 'shared', duration: 0 } as object };
        const first = Toast.info({ content: 'a' });
        const second = Toast.info({ content: 'b' });
        expect(first).not.toBe('shared');
        expect(first).not.toBe(second);
    });

    it('到期只关闭一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const close = vi.fn<(id: string) => void>();
        render(() => <ToastItem id="once" close={close} content="once" duration={1} onClose={onClose} />);
        vi.advanceTimersByTime(1000);
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith('once');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('离场中的 Toast 保留其在列表中的位置', () => {
        const texts = () => [...document.querySelectorAll(`.${prefix}-info`)].map((toast) => toast.textContent);
        Toast.info({ id: 'a', content: 'a', duration: 0 });
        Toast.info({ id: 'b', content: 'b', duration: 0 });
        Toast.info({ id: 'c', content: 'c', duration: 0 });
        Toast.close('b');
        expect(texts()).toEqual(['a', 'b', 'c']);
        Toast.info({ id: 'b', content: 'b2', duration: 0 });
        expect(texts()).toEqual(['a', 'c', 'b2']);
    });

    it('按 id 更新 Toast 会重新开始计时 duration', () => {
        vi.useFakeTimers();
        Toast.info({ id: 'u', content: 'v1', duration: 1, motion: false });
        vi.advanceTimersByTime(800);
        Toast.info({ id: 'u', content: 'v2', duration: 1, motion: false });
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toBeNull();
    });

    it('离场途中以同一 id 再次显示会重新开始计时 duration', () => {
        vi.useFakeTimers();
        Toast.info({ id: 'r', content: 'v1', duration: 1 });
        vi.advanceTimersByTime(800);
        Toast.close('r');
        expect(getInfoToast()).toHaveClass(hideCls);
        Toast.info({ id: 'r', content: 'v2', duration: 1 });
        expect(getInfoToast()).not.toHaveClass(hideCls);
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        expect(getInfoToast()).not.toHaveClass(hideCls);
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toHaveClass(hideCls);
    });

    it('data-* 等未知选项透传到 Toast 元素，id 除外', () => {
        Toast.info({ id: 'own-id', content: 'attrs', duration: 0, 'data-testid': 'toast-attrs' });
        expect(screen.getByTestId('toast-attrs')).toBe(getInfoToast());
        expect(document.getElementById('own-id')).toBeNull();
        const { container } = render(() => <ToastItem data-foo="bar" content="item" />);
        const item = container.querySelector(`.${prefix}`);
        expect(item).toHaveAttribute('data-foo', 'bar');
        expect(item).toHaveAttribute('role', 'status');
    });

    it('style 为对象或字符串时都保留，并带上层级用的 transform', () => {
        Toast.info({ content: 'object', duration: 0, style: { color: 'red' } });
        Toast.success({ content: 'string', duration: 0, style: 'color: blue' });
        // one newer toast sits in front of the first
        expect(getInfoToast()).toHaveStyle({ color: 'rgb(255, 0, 0)', transform: 'translate3d(0,0,-10px)' });
        expect(document.querySelector(`.${prefix}-success`)).toHaveStyle({ color: 'rgb(0, 0, 255)', transform: 'translate3d(0,0,0px)' });
    });

    it('direction 输出为 Toast 元素的 dir；没有方向时不输出，保留使用方传入的 dir', () => {
        Toast.info({ content: 'rtl', duration: 0, direction: 'rtl' });
        expect(getInfoToast()).toHaveAttribute('dir', 'rtl');
        const { container } = render(() => <ToastItem content="item" />);
        expect(container.querySelector(`.${prefix}`)).not.toHaveAttribute('dir');
        const own = render(() => <ToastItem dir="rtl" content="own" />);
        expect(own.container.querySelector(`.${prefix}`)).toHaveAttribute('dir', 'rtl');
    });

    it('单个 Toast 的 ref 拿到 Toast 元素', () => {
        let element: HTMLDivElement | undefined;
        const { container } = render(() => <ToastItem ref={(node) => (element = node)} content="ref" />);
        expect(element).toBe(container.querySelector(`.${prefix}`));
    });

    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        Toast.info({ id: 'progress', content: '10%', duration: 1, motion: false, onClose });
        fireEvent.mouseEnter(getList());
        Toast.info({ id: 'progress', content: '50%', duration: 1, motion: false, onClose });
        vi.advanceTimersByTime(5000);
        expect(getInfoToast()).toHaveTextContent(/^50%$/);
        fireEvent.mouseLeave(getList());
        vi.advanceTimersByTime(999);
        expect(getInfoToast()).not.toBeNull();
        vi.advanceTimersByTime(1);
        expect(getInfoToast()).toBeNull();
        vi.advanceTimersByTime(5000);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('悬停期间 stack 列表被清空后，新的一批 Toast 重新收起堆叠', () => {
        Toast.info({ id: 'a', content: 'a', duration: 0, motion: false, stack: 1 });
        const list = getList();
        fireEvent.mouseEnter(list);
        expect(list).toHaveClass(`${prefix}-innerWrapper-hover`);
        Toast.close('a');
        expect(getInfoToast()).toBeNull();
        Toast.info({ content: 'b', duration: 0, motion: false, stack: 1 });
        Toast.info({ content: 'c', duration: 0, motion: false, stack: 1 });
        expect(document.querySelectorAll(`.${prefix}-info`)).toHaveLength(2);
        expect(list).not.toHaveClass(`${prefix}-innerWrapper-hover`);
    });

    it('后一条 Toast 切换 stack 时，已显示的 Toast 节点与焦点保持不变', () => {
        Toast.info({ content: 'a', duration: 0, stack: true });
        const first = getInfoToast() as HTMLElement;
        const closeButton = first.querySelector('button') as HTMLElement;
        closeButton.focus();
        Toast.info({ content: 'b', duration: 0 });
        expect(first.isConnected).toBe(true);
        expect(closeButton.isConnected).toBe(true);
        expect(document.activeElement).toBe(closeButton);
    });

    it('聚焦的 Toast 被移除后，其余 Toast 不再永久暂停', () => {
        vi.useFakeTimers();
        Toast.info({ id: 'gone', content: 'gone', duration: 0, motion: false });
        Toast.success({ id: 'stays', content: 'stays', duration: 1, motion: false });
        ((getInfoToast() as HTMLElement).querySelector('button') as HTMLElement).focus();
        Toast.close('gone');
        expect(getInfoToast()).toBeNull();
        vi.advanceTimersByTime(1000);
        expect(document.querySelector(`.${prefix}-success`)).toBeNull();
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${prefix}-announcer`);
        it('常驻播报区先于消息存在，消息文本在之后的任务中写入，随后清空', () => {
            vi.useFakeTimers();
            Toast.info({ content: 'saved', duration: 0, motion: false });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()).toBeEmptyDOMElement();
            vi.advanceTimersByTime(100);
            expect(getAnnouncer()).toHaveTextContent(/^saved$/);
            vi.advanceTimersByTime(1000);
            expect(getAnnouncer()?.textContent).toBe('');
        });
        it('同一 id 在播报前连续更新，只播报一次最新文本', () => {
            vi.useFakeTimers();
            Toast.info({ id: 'up', content: '10%', duration: 0, motion: false });
            Toast.info({ id: 'up', content: '20%', duration: 0, motion: false });
            vi.advanceTimersByTime(100);
            expect(getAnnouncer()).toHaveTextContent(/^20%$/);
        });
        it('消息项自身不再播报，避免与播报区重复', () => {
            Toast.info({ content: 'saved', duration: 0 });
            expect(getInfoToast()).toHaveAttribute('aria-live', 'off');
        });
        it('warning 和 error 保持 alert，不写入播报区', () => {
            vi.useFakeTimers();
            Toast.error({ content: 'failed', duration: 0, motion: false });
            vi.advanceTimersByTime(100);
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            expect(getAnnouncer()).toBeEmptyDOMElement();
        });
    });

    it('stack 模式下悬停已更新的 Toast 会保持打开', () => {
        vi.useFakeTimers();
        Toast.info({ id: 'x', content: 'v1', duration: 1, motion: false, stack: true });
        Toast.info({ id: 'x', content: 'v2', duration: 1, motion: false, stack: true });
        fireEvent.mouseEnter(getList());
        vi.advanceTimersByTime(2000);
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
    });
});
