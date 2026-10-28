import { StrictMode, useEffect, type ReactElement } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { IconWifi } from '@fibrae/semi-icons-react';
import { Toast, ToastFactory } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { ToastHookApi, ToastReactProps } from '../index';
import ToastItem from '../toast';

const getInfoToast = () => document.querySelector(`.${BASE_CLASS_PREFIX}-toast-info`);
// The static API renders into its own root, which commits only inside act
const show = (opts) =>
    act(() => {
        Toast.info(opts);
    });

function HookHost({ onApi }: { onApi: (toast: ToastHookApi) => void }) {
    const [toast, contextHolder] = Toast.useToast();
    useEffect(() => {
        onApi(toast);
    });
    return <div data-testid="holder">{contextHolder}</div>;
}

// jsdom has no AnimationEvent, so React listens for the webkit-prefixed name of animationend
const endLeave = (holder: HTMLElement) => act(() => holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-animation-hide`).forEach((toast) => toast.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }))));

describe('Toast', () => {
    beforeEach(() => {
        // undo vitest/setup.ts freezing Date so Toast timers follow the real clock
        vi.useRealTimers();
        // jsdom runs no animation; report one so the list waits for the animationend the tests dispatch
        vi.spyOn(Element.prototype, 'getAnimations').mockReturnValue([{ animationName: 'show' } as CSSAnimation]);
    });
    afterEach(async () => {
        // Toast renders into its own root outside Testing Library's cleanup; the root unmounts in a microtask
        await act(async () => Toast.destroyAll());
        vi.useRealTimers();
    });
    it('基础展示 Toast 及其内容', () => {
        show('semi');
        expect(getInfoToast()).toHaveTextContent(/^semi$/);
    });
    it('theme: light 主题', () => {
        show({
            content: 'semi',
            theme: 'light',
        });
        expect(getInfoToast()).toHaveClass(`${BASE_CLASS_PREFIX}-toast-light`);
    });
    it('duration 大于 0', () => {
        vi.useFakeTimers();
        show({
            duration: 1,
            content: 'dur1',
            motion: false,
        });
        expect(getInfoToast()).toHaveTextContent(/^dur1$/);
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toBeNull();
    });
    it('显式传入 undefined 的 duration 等同未传，沿用 Toast.config 的值', () => {
        vi.useFakeTimers();
        Toast.config({ duration: 10 });
        show({ content: 'configured', duration: undefined, motion: false });
        act(() => {
            vi.advanceTimersByTime(3500);
        });
        expect(getInfoToast()).toHaveTextContent(/^configured$/);
        act(() => {
            vi.advanceTimersByTime(7000);
        });
        expect(getInfoToast()).toBeNull();
    });
    it('按 id 更新内容', () => {
        vi.useFakeTimers();
        const id = 'toastid';
        show({ content: 'bytedance', id, motion: false });
        const toast = getInfoToast();
        expect(toast).toHaveTextContent(/^bytedance$/);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        act(() => {
            Toast.info({ content: 'dancebyte', id, motion: false });
        });
        expect(toast).toHaveTextContent(/^dancebyte$/);
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        act(() => {
            Toast.error({ content: 'error', id, motion: false });
        });
        expect(toast).toHaveTextContent(/^error$/);
        expect(toast.className).toEqual(`${BASE_CLASS_PREFIX}-toast ${BASE_CLASS_PREFIX}-toast-error`);
    });
    it('duration 后触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show({
            onClose,
            content: 'bytedance',
            duration: 0.8,
        });
        act(() => {
            vi.advanceTimersByTime(799);
        });
        expect(onClose).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('手动关闭后计时器不再触发第二次 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show({ onClose, content: 'bytedance', duration: 1 });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('点击关闭按钮时触发 onClose', async () => {
        const onClose = vi.fn<() => void>();
        render(<ToastItem content="bytedance" onClose={onClose} />);
        await userEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('onClose 显式为 null 时点击关闭按钮不抛错', async () => {
        render(<ToastItem content="bytedance" onClose={null} />);
        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByText('bytedance')).toBeInTheDocument();
    });
    it('showClear = false', () => {
        const { container } = render(<ToastItem content="showCloseToast" duration={1} showClose={false} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-toast-close-button`)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });
    it('自定义图标', () => {
        const { container } = render(<ToastItem content="semi" icon={<IconWifi />} />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-icon-wifi`)).not.toBeNull();
    });
    it('自定义 Semi 图标保留使用方的 className 与 size', () => {
        const { container } = render(<ToastItem content="semi" icon={<IconWifi className="mine" size="small" />} />);
        const icon = container.querySelector(`.${BASE_CLASS_PREFIX}-icon-wifi`);
        expect(icon).toHaveClass('mine', `${BASE_CLASS_PREFIX}-toast-icon`, `${BASE_CLASS_PREFIX}-icon-small`);
    });
    it('指定 getPopupContainer', async () => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        const ContainerToast = ToastFactory.create({
            getPopupContainer: () => document.querySelector(`#toast-container`),
        });
        act(() => {
            ContainerToast.info('specific getPopupContainer');
        });
        expect(document.querySelector(`#${ContainerToast.getWrapperId()}`).parentNode).toBe(container);
        expect(container).toHaveTextContent('specific getPopupContainer');
        await act(async () => ContainerToast.destroyAll());
        container.remove();
    });
    it('resetConfig 恢复内置默认值', () => {
        Toast.config({ top: '400px', theme: 'light', zIndex: 2333, duration: 0 });
        Toast.resetConfig();
        act(() => {
            Toast.info('semi');
        });
        const wrapper = document.getElementById(Toast.getWrapperId());
        expect(wrapper).toHaveStyle({ zIndex: '1010' });
        expect(wrapper.style.top).toBe('');
        expect(getInfoToast()).not.toHaveClass(`${BASE_CLASS_PREFIX}-toast-light`);
        expect(Toast.defaultOpts.duration).toBeUndefined();
    });
    it('config({ top: undefined }) 清除容器上已有的 top', () => {
        try {
            Toast.config({ top: 10 });
            act(() => {
                Toast.info('first');
            });
            const wrapper = document.getElementById(Toast.getWrapperId());
            expect(wrapper.style.top).toBe('10px');
            Toast.config({ top: undefined });
            act(() => {
                Toast.info('second');
            });
            expect(wrapper.style.top).toBe('');
        } finally {
            Toast.resetConfig();
        }
    });
    it('ToastFactory 实例上的 resetConfig 恢复其创建时的配置', async () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000, duration: 5 });
        Other.config({ top: 10, zIndex: 4000, duration: 9 });
        Other.resetConfig();
        expect(Other.defaultOpts).toMatchObject({ top: 77, zIndex: 3000, duration: 5 });
        act(() => {
            Other.info('other');
        });
        expect(document.getElementById(Other.getWrapperId())).toHaveStyle({ top: '77px', zIndex: '3000' });
        await act(async () => Other.destroyAll());
    });
    it('同一批次中的所有 Toast 都保持显示', () => {
        act(() => {
            Toast.info('first');
        });
        act(() => {
            Toast.info('second');
            Toast.info({ id: 'same', content: 'v1' });
            Toast.info({ id: 'same', content: 'v2' });
        });
        const toasts = document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-info`);
        expect([...toasts].map((toast) => toast.textContent)).toEqual(['first', 'second', 'v2']);
    });
    it('同一批次关闭的 Toast 都播放离场动画', () => {
        const getToasts = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-info`)];
        const hideCls = `${BASE_CLASS_PREFIX}-toast-animation-hide`;
        act(() => {
            Toast.info({ id: 'a', content: 'a', duration: 0 });
        });
        act(() => {
            Toast.info({ id: 'b', content: 'b', duration: 0 });
        });
        act(() => {
            Toast.close('a');
            Toast.close('b');
        });
        expect(getToasts().map((toast) => [toast.textContent, toast.classList.contains(hideCls)])).toEqual([
            ['a', true],
            ['b', true],
        ]);

        act(() => {
            Toast.info({ id: 'c', content: 'c', duration: 0 });
        });
        expect(getToasts().map((toast) => toast.textContent)).toEqual(expect.arrayContaining(['a', 'b', 'c']));

        act(() => {
            document.querySelectorAll(`.${hideCls}`).forEach((toast) => toast.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true })));
        });
        expect(getToasts().map((toast) => toast.textContent)).toEqual(['c']);
    });
    it('渲染各类型的类名和图标，没有 type 的 Toast 不显示图标', () => {
        const types = ['info', 'success', 'warning', 'error'];
        act(() => {
            types.forEach((type) => Toast[type]({ content: type, duration: 0 }));
            Toast.create({ content: 'plain', duration: 0 });
        });
        for (const type of types) {
            const toast = screen.getByLabelText(zh_CN.Toast[type]);
            expect(toast).toHaveClass(`${BASE_CLASS_PREFIX}-toast`, `${BASE_CLASS_PREFIX}-toast-${type}`);
            expect(toast.querySelector(`.${BASE_CLASS_PREFIX}-toast-icon-${type}`)).not.toBeNull();
        }
        const plain = screen.getByLabelText(zh_CN.Toast.default);
        expect(plain).toHaveTextContent(/^plain$/);
        expect(plain.querySelector(`.${BASE_CLASS_PREFIX}-toast-icon`)).toBeNull();
    });
    it('悬停时暂停关闭计时器', () => {
        vi.useFakeTimers();
        show({ content: 'hover', duration: 1, motion: false });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        fireEvent.mouseEnter(getInfoToast());
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(getInfoToast()).not.toBeNull();
        fireEvent.mouseLeave(getInfoToast());
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toBeNull();
    });
    it('焦点在列表内时暂停关闭计时器，焦点离开后重新计时', () => {
        vi.useFakeTimers();
        show({ content: 'focus', duration: 1, motion: false });
        const close = screen.getByRole('button', { name: zh_CN.Toast.close });
        act(() => {
            close.focus();
            vi.advanceTimersByTime(2000);
        });
        expect(getInfoToast()).not.toBeNull();
        act(() => {
            close.blur();
        });
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toBeNull();
    });
    it('Toast.close 进入离场后，剩余计时到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show({ id: 'leaving', content: 'leaving', duration: 1, onClose });
        act(() => {
            vi.advanceTimersByTime(900);
        });
        act(() => {
            Toast.close('leaving');
        });
        expect(getInfoToast()).toHaveClass(`${BASE_CLASS_PREFIX}-toast-animation-hide`);
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(onClose).not.toHaveBeenCalled();
    });
    it('contextHolder 重新挂载时，残留的离场 Toast 不计时，到期不触发 onClose', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        let api: ToastHookApi;
        function Host({ shown }: { shown: boolean }) {
            const [toast, contextHolder] = Toast.useToast();
            useEffect(() => {
                api = toast;
            });
            return <>{shown && contextHolder}</>;
        }
        const view = render(<Host shown />);
        act(() => {
            api.close(api.info({ content: 'leftover', duration: 1, onClose }));
        });
        view.rerender(<Host shown={false} />);
        view.rerender(<Host shown />);
        expect(getInfoToast()).toHaveClass(`${BASE_CLASS_PREFIX}-toast-animation-hide`);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(onClose).not.toHaveBeenCalled();
    });
    it('每次调用都应用 zIndex', () => {
        show('a');
        act(() => {
            Toast.info({ content: 'b', zIndex: 2000 });
        });
        expect(document.getElementById(Toast.getWrapperId())).toHaveStyle({ zIndex: '2000' });
    });
    it('info、success 与无 type 的 Toast 为 status，warning、error 为 alert', () => {
        act(() => {
            (['info', 'success', 'warning', 'error'] as const).forEach((type) => Toast[type]({ content: type, duration: 0 }));
            Toast.create({ content: 'plain', duration: 0 });
        });
        expect(screen.getByRole('status', { name: zh_CN.Toast.info })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: zh_CN.Toast.success })).toBeInTheDocument();
        expect(screen.getByRole('status', { name: zh_CN.Toast.default })).toBeInTheDocument();
        expect(screen.getByRole('alert', { name: zh_CN.Toast.warning })).toBeInTheDocument();
        expect(screen.getByRole('alert', { name: zh_CN.Toast.error })).toBeInTheDocument();
    });
    it('duration 为 0 时不会自动关闭', () => {
        vi.useFakeTimers();
        show({ content: 'stay', duration: 0, motion: false });
        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        expect(getInfoToast()).toHaveTextContent(/^stay$/);
    });
    it('关闭按钮只触发一次 onClose，Toast.close 不触发', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show({ id: 'btn', content: 'btn', duration: 1, motion: false, onClose });
        fireEvent.click(getInfoToast().querySelector('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getInfoToast()).toBeNull();
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);

        const onManualClose = vi.fn<() => void>();
        show({ id: 'manual', content: 'manual', duration: 1, motion: false, onClose: onManualClose });
        act(() => Toast.close('manual'));
        expect(getInfoToast()).toBeNull();
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(onManualClose).not.toHaveBeenCalled();
    });
    it('离场动画期间再次点击关闭按钮，onClose 只触发一次', () => {
        const onClose = vi.fn<() => void>();
        show({ content: 'twice', duration: 0, onClose });
        const button = getInfoToast().querySelector('button');
        fireEvent.click(button);
        // jsdom fires no animationend, so the toast stays mounted while leaving
        expect(getInfoToast()).toHaveClass(`${BASE_CLASS_PREFIX}-toast-animation-hide`);
        fireEvent.click(button);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('ToastFactory 实例各自保留容器和配置', async () => {
        const Other = ToastFactory.create({ top: 77, zIndex: 3000 });
        act(() => {
            Toast.info({ content: 'main', duration: 0 });
            Other.info({ content: 'other', duration: 0 });
        });
        const main = document.getElementById(Toast.getWrapperId());
        const other = document.getElementById(Other.getWrapperId());
        expect(main).not.toBe(other);
        expect(main).toHaveStyle({ zIndex: '1010' });
        expect(main.style.top).toBe('');
        expect(other).toHaveStyle({ top: '77px', zIndex: '3000' });
        expect(main).toHaveTextContent(/^main$/);
        expect(other).toHaveTextContent(/^other$/);
        await act(async () => Other.destroyAll());
        expect(other.isConnected).toBe(false);
        expect(Other.getWrapperId()).toBeNull();
        expect(main).toHaveTextContent(/^main$/);
    });
    it('useToast 在 contextHolder 中渲染 Toast，并按 id 关闭', () => {
        let api;
        render(<HookHost onApi={(toast) => (api = toast)} />);
        let id;
        act(() => {
            id = api.success({ content: 'hook', duration: 0 });
            api.info({ content: 'hook2', duration: 0 });
        });
        const holder = screen.getByTestId('holder');
        expect(holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast`)).toHaveLength(2);
        expect(holder.querySelector(`.${BASE_CLASS_PREFIX}-toast-success`)).toHaveTextContent(/^hook$/);
        void act(() => api.close(id));
        endLeave(holder);
        expect(holder.querySelector(`.${BASE_CLASS_PREFIX}-toast-success`)).toBeNull();
        expect(holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast`)).toHaveLength(1);
    });
    it('useToast 传入 undefined 的 duration 不覆盖默认值，Toast 会自动关闭', () => {
        vi.useFakeTimers();
        let api;
        render(<HookHost onApi={(toast) => (api = toast)} />);
        act(() => {
            api.info({ content: 'auto', duration: undefined, motion: false });
        });
        const holder = screen.getByTestId('holder');
        expect(holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast`)).toHaveLength(1);
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        endLeave(holder);
        expect(holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast`)).toHaveLength(0);
    });
    it('useToast 在重渲染之间返回同一个 api 与 contextHolder，memo 子组件可据此跳过渲染', () => {
        const results: [ToastHookApi, ReactElement][] = [];
        function Host({ tick }: { tick: number }) {
            const result = Toast.useToast();
            results.push(result);
            return <div data-tick={tick}>{result[1]}</div>;
        }
        const { rerender } = render(<Host tick={0} />);
        rerender(<Host tick={1} />);
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.at(-1)[0]).toBe(results[0][0]);
        expect(results.at(-1)[1]).toBe(results[0][1]);
    });
    it('useToast 关闭 Toast 时先播放离场动画，动画结束后才移除', () => {
        let api;
        render(<HookHost onApi={(toast) => (api = toast)} />);
        const hideCls = `${BASE_CLASS_PREFIX}-toast-animation-hide`;
        let id;
        act(() => {
            id = api.info({ content: 'hook', duration: 0 });
        });
        const holder = screen.getByTestId('holder');
        void act(() => api.close(id));
        expect(holder.querySelector(`.${BASE_CLASS_PREFIX}-toast-info`)).toHaveClass(hideCls);
        endLeave(holder);
        expect(holder.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).toBeNull();
    });
    it('useToast 的类型：返回 [api, contextHolder] 元组，api 参数与静态方法一致', () => {
        type UseToastReturn = ReturnType<typeof Toast.useToast>;
        type Options = Omit<ToastReactProps, 'type' | 'close' | 'id' | 'zIndex' | 'getPopupContainer'>;
        expectTypeOf<UseToastReturn>().toEqualTypeOf<[ToastHookApi, ReactElement]>();
        for (const method of ['success', 'info', 'error', 'warning', 'open'] as const) {
            expectTypeOf<Parameters<ToastHookApi[typeof method]>>().toEqualTypeOf<[Options]>();
        }
        expectTypeOf<ToastHookApi['close']>().toEqualTypeOf<(id: string) => void>();
        expectTypeOf<Options>().not.toHaveProperty('id');
        expectTypeOf<Options>().not.toHaveProperty('zIndex');
        expectTypeOf<Options>().not.toHaveProperty('getPopupContainer');
    });
    it('静态方法与 hook 的选项类型不含由列表提供的 close，接受 data-* 与 aria-* 属性', () => {
        type StaticOptions = Exclude<Parameters<typeof Toast.info>[0], string>;
        expectTypeOf<StaticOptions>().not.toHaveProperty('close');
        expectTypeOf<StaticOptions>().not.toHaveProperty('type');
        expectTypeOf<StaticOptions>().toHaveProperty('zIndex');
        expectTypeOf({ content: 'a', 'data-testid': 'x', 'aria-describedby': 'y' }).toExtend<StaticOptions>();
        expectTypeOf({ content: 'a', 'data-testid': 'x' }).toExtend<Parameters<ToastHookApi['info']>[0]>();
        // @ts-expect-error close is supplied by the list
        const withClose: StaticOptions = { content: 'a', close: () => {} };
        expect(withClose).toBeDefined();
    });
    it('读取 semiGlobal overrideDefaultProps.Toast 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Toast: { theme: 'light', showClose: false, top: 12 } };
        try {
            show({ content: 'global', duration: 0 });
            expect(getInfoToast()).toHaveClass(`${BASE_CLASS_PREFIX}-toast-light`);
            expect(getInfoToast().querySelector('button')).toBeNull();
            expect(document.getElementById(Toast.getWrapperId())).toHaveStyle({ top: '12px' });
            act(() => {
                Toast.success({ content: 'own', duration: 0, theme: 'normal', showClose: true });
            });
            const own = document.querySelector(`.${BASE_CLASS_PREFIX}-toast-success`);
            expect(own).not.toHaveClass(`${BASE_CLASS_PREFIX}-toast-light`);
            expect(own.querySelector('button')).not.toBeNull();
            const { container } = render(<ToastItem content="item" />);
            expect(container.querySelector('button')).toBeNull();
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
    it('全局默认值里的 id 不生效，每条 toast 的 id 各不相同', () => {
        semiGlobal.config.overrideDefaultProps = { Toast: { id: 'shared', duration: 0 } as object };
        try {
            let first = '';
            let second = '';
            act(() => {
                first = Toast.info({ content: 'a' });
                second = Toast.info({ content: 'b' });
            });
            expect(first).not.toBe('shared');
            expect(first).not.toBe(second);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
    it('StrictMode 下只关闭一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        const close = vi.fn<(id: string) => void>();
        render(
            <StrictMode>
                <ToastItem id="strict" close={close} content="strict" duration={1} onClose={onClose} />
            </StrictMode>
        );
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(close).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledWith('strict');
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('离场中的 Toast 保留其在列表中的位置', () => {
        const texts = () => [...document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-info`)].map((toast) => toast.textContent);
        act(() => {
            Toast.info({ id: 'a', content: 'a', duration: 0 });
        });
        act(() => {
            Toast.info({ id: 'b', content: 'b', duration: 0 });
            Toast.info({ id: 'c', content: 'c', duration: 0 });
        });
        act(() => Toast.close('b'));
        expect(texts()).toEqual(['a', 'b', 'c']);
        act(() => {
            Toast.info({ id: 'b', content: 'b2', duration: 0 });
        });
        expect(texts()).toEqual(['a', 'c', 'b2']);
    });
    it('按 id 更新 Toast 会重新开始计时 duration', () => {
        vi.useFakeTimers();
        show({ id: 'u', content: 'v1', duration: 1, motion: false });
        act(() => {
            vi.advanceTimersByTime(800);
        });
        act(() => {
            Toast.info({ id: 'u', content: 'v2', duration: 1, motion: false });
        });
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toBeNull();
    });
    it('离场途中以同一 id 再次显示会重新开始计时 duration', () => {
        vi.useFakeTimers();
        const hideCls = `${BASE_CLASS_PREFIX}-toast-animation-hide`;
        show({ id: 'r', content: 'v1', duration: 1 });
        act(() => {
            vi.advanceTimersByTime(800);
        });
        act(() => Toast.close('r'));
        expect(getInfoToast()).toHaveClass(hideCls);
        act(() => {
            Toast.info({ id: 'r', content: 'v2', duration: 1 });
        });
        expect(getInfoToast()).not.toHaveClass(hideCls);
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
        expect(getInfoToast()).not.toHaveClass(hideCls);
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toHaveClass(hideCls);
    });
    it('data-* 等未知选项透传到 Toast 元素，id 除外', () => {
        show({ id: 'own-id', content: 'attrs', duration: 0, 'data-testid': 'toast-attrs' });
        expect(screen.getByTestId('toast-attrs')).toBe(getInfoToast());
        expect(document.getElementById('own-id')).toBeNull();
        const { container } = render(<ToastItem data-foo="bar" content="item" />);
        const item = container.querySelector(`.${BASE_CLASS_PREFIX}-toast`);
        expect(item).toHaveAttribute('data-foo', 'bar');
        expect(item).toHaveAttribute('role', 'status');
    });
    it('direction 输出为 Toast 元素的 dir；没有方向时不输出，保留使用方传入的 dir', () => {
        show({ content: 'rtl', duration: 0, direction: 'rtl' });
        expect(getInfoToast()).toHaveAttribute('dir', 'rtl');
        const { container } = render(<ToastItem content="item" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).not.toHaveAttribute('dir');
        const own = render(<ToastItem dir="rtl" content="own" />);
        expect(own.container.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).toHaveAttribute('dir', 'rtl');
    });
    it('单个 Toast 的 ref 暴露 restartCloseTimer', () => {
        vi.useFakeTimers();
        const close = vi.fn<(id: string) => void>();
        const ref = { current: null };
        render(<ToastItem ref={ref} id="r" close={close} content="ref" duration={1} />);
        act(() => {
            vi.advanceTimersByTime(800);
        });
        void act(() => ref.current.restartCloseTimer());
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(close).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(close).toHaveBeenCalledWith('r');
    });
    it('StrictMode 下 useToast 正常工作', async () => {
        let api;
        render(
            <StrictMode>
                <HookHost onApi={(toast) => (api = toast)} />
            </StrictMode>
        );
        act(() => {
            api.info({ content: 'strict hook', duration: 0 });
        });
        const holder = screen.getByTestId('holder');
        expect(holder.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast`)).toHaveLength(1);
        await userEvent.click(holder.querySelector('button'));
        endLeave(holder);
        expect(holder.querySelector(`.${BASE_CLASS_PREFIX}-toast`)).toBeNull();
    });
    it('悬停期间按同 id 更新不会重启计时，移出后满 duration 才关闭且 onClose 只触发一次', () => {
        vi.useFakeTimers();
        const onClose = vi.fn<() => void>();
        show({ id: 'progress', content: '10%', duration: 1, motion: false, onClose });
        fireEvent.mouseEnter(getInfoToast());
        show({ id: 'progress', content: '50%', duration: 1, motion: false, onClose });
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(getInfoToast()).toHaveTextContent(/^50%$/);

        fireEvent.mouseLeave(getInfoToast());
        act(() => {
            vi.advanceTimersByTime(999);
        });
        expect(getInfoToast()).not.toBeNull();
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(getInfoToast()).toBeNull();
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('悬停期间 stack 列表被清空后，新的一批 Toast 重新收起堆叠', () => {
        show({ id: 'a', content: 'a', duration: 0, motion: false, stack: 1 });
        const list = document.querySelector(`.${BASE_CLASS_PREFIX}-toast-innerWrapper`);
        fireEvent.mouseEnter(list);
        expect(list).toHaveClass(`${BASE_CLASS_PREFIX}-toast-innerWrapper-hover`);
        act(() => Toast.close('a'));
        expect(getInfoToast()).toBeNull();
        act(() => {
            Toast.info({ content: 'b', duration: 0, motion: false, stack: 1 });
            Toast.info({ content: 'c', duration: 0, motion: false, stack: 1 });
        });
        expect(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-toast-info`)).toHaveLength(2);
        expect(list).not.toHaveClass(`${BASE_CLASS_PREFIX}-toast-innerWrapper-hover`);
    });
    it('后一条 Toast 切换 stack 时，已显示的 Toast 节点与焦点保持不变', () => {
        show({ content: 'a', duration: 0, stack: true });
        const first = getInfoToast();
        const closeButton = first.querySelector('button');
        act(() => closeButton.focus());
        act(() => {
            Toast.info({ content: 'b', duration: 0 });
        });
        expect(first.isConnected).toBe(true);
        expect(closeButton.isConnected).toBe(true);
        expect(document.activeElement).toBe(closeButton);
    });

    describe('读屏播报', () => {
        const getAnnouncer = () => document.querySelector(`.${BASE_CLASS_PREFIX}-toast-announcer`);
        it('常驻播报区先于消息存在，消息文本在之后的任务中写入，随后清空', () => {
            vi.useFakeTimers();
            show({ content: 'saved', duration: 0, motion: false });
            expect(getAnnouncer()).toHaveAttribute('aria-live', 'polite');
            expect(getAnnouncer()).toBeEmptyDOMElement();
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(getAnnouncer()).toHaveTextContent(/^saved$/);
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(getAnnouncer()).toBeEmptyDOMElement();
        });
        it('同一 id 在播报前连续更新，只播报一次最新文本', () => {
            vi.useFakeTimers();
            show({ id: 'up', content: '10%', duration: 0, motion: false });
            show({ id: 'up', content: '20%', duration: 0, motion: false });
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(getAnnouncer()).toHaveTextContent(/^20%$/);
        });
        it('消息项自身不再播报，避免与播报区重复', () => {
            show({ content: 'saved', duration: 0 });
            expect(getInfoToast()).toHaveAttribute('aria-live', 'off');
        });
        it('warning 和 error 保持 alert，不写入播报区', () => {
            vi.useFakeTimers();
            act(() => {
                Toast.error({ content: 'failed', duration: 0, motion: false });
            });
            act(() => {
                vi.advanceTimersByTime(100);
            });
            expect(screen.getByRole('alert')).not.toHaveAttribute('aria-live');
            expect(getAnnouncer()).toBeEmptyDOMElement();
        });
    });

    it('stack 模式下悬停已更新的 Toast 会保持打开', () => {
        vi.useFakeTimers();
        show({ id: 'x', content: 'v1', duration: 1, motion: false, stack: true });
        act(() => {
            Toast.info({ id: 'x', content: 'v2', duration: 1, motion: false, stack: true });
        });
        fireEvent.mouseEnter(getInfoToast());
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(getInfoToast()).toHaveTextContent(/^v2$/);
    });
});
