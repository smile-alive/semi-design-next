import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { HotKeys } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { HotKeysProps } from '../interface';
import HotKeysHost from './hot-keys-host.svelte';
import TemplateRefTarget from './template-ref-target.svelte';

const prefix = `${BASE_CLASS_PREFIX}-hotKeys`;
const getRoot = (container: Element) => container.querySelector<HTMLElement>(`.${prefix}`);

// Dispatched by hand because the caller needs defaultPrevented
function press(target: EventTarget, init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}
const hotKeyHandler = () => vi.fn<(event: KeyboardEvent) => void>();
function mount(props: HotKeysProps, withChildren = false) {
    const store = createStore<HotKeysProps>(props);
    const view = render(HotKeysHost, { props: { store, withChildren } });
    return { store, view };
}

describe('HotKeys', () => {
    it('class、style 与未知属性落在根元素', () => {
        const { view } = mount({ hotKeys: ['r'], id: 'hk', class: 'test', style: 'color: red', 'aria-label': 'Search', 'data-testid': 'x' });
        const root = getRoot(view.container);
        expect(root).toHaveClass('test');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(root).toHaveAttribute('id', 'hk');
        expect(root).toHaveAttribute('aria-label', 'Search');
        expect(root).toHaveAttribute('data-testid', 'x');
    });

    it('click 作为原生属性落到根元素', () => {
        const onclick = vi.fn<(event: MouseEvent) => void>();
        const { view } = mount({ hotKeys: ['k'], onclick });
        (getRoot(view.container) as HTMLElement).click();
        expect(onclick).toHaveBeenCalledTimes(1);
    });

    it('不把组件属性放到根元素上', () => {
        const { view } = mount({ content: ['K'], hotKeys: ['k'], preventDefault: true, onHotKey: () => undefined });
        const root = getRoot(view.container);
        for (const name of ['hotkeys', 'content', 'preventdefault', 'onhotkey']) {
            expect(root).not.toHaveAttribute(name);
        }
    });
});

describe('HotKeys 行为', () => {
    const targets: HTMLElement[] = [];
    const createTarget = () => {
        const node = document.createElement('input');
        document.body.append(node);
        targets.push(node);
        return node;
    };
    afterEach(() => {
        targets.splice(0).forEach((node) => node.remove());
    });

    it('在 document.body 上按下组合键时，调用 onHotKey 并传入键盘事件', () => {
        const onHotKey = hotKeyHandler();
        mount({ hotKeys: [HotKeys.Keys.Control, 'k'], onHotKey });
        press(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        expect(onHotKey.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
        expect(onHotKey.mock.calls[0]?.[0].code).toBe('KeyK');
    });

    it('接收从 document.body 后代冒泡上来的事件', () => {
        const onHotKey = hotKeyHandler();
        const { view } = mount({ hotKeys: ['Control', 'k'], onHotKey });
        press(getRoot(view.container) as HTMLElement, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('忽略 hotKeys 中按键的顺序', () => {
        const onHotKey = hotKeyHandler();
        mount({ hotKeys: ['k', 'Shift', 'Meta'], onHotKey });
        press(document.body, { code: 'KeyK', metaKey: true, shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('要求修饰键完全匹配，且普通键匹配', () => {
        const onHotKey = hotKeyHandler();
        mount({ hotKeys: ['Control', 'k'], onHotKey });
        press(document.body, { code: 'KeyK' });
        press(document.body, { code: 'KeyK', ctrlKey: true, shiftKey: true });
        press(document.body, { code: 'KeyK', ctrlKey: true, altKey: true });
        press(document.body, { code: 'KeyK', ctrlKey: true, metaKey: true });
        press(document.body, { code: 'KeyJ', ctrlKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(document.body, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('单个普通键只在无修饰键时触发', () => {
        const onHotKey = hotKeyHandler();
        mount({ hotKeys: ['r'], onHotKey });
        press(document.body, { code: 'KeyR', shiftKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(document.body, { code: 'KeyR' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('按 event.code 而非 event.key 匹配按键，不区分大小写', () => {
        const onHotKey = hotKeyHandler();
        mount({ hotKeys: ['CONTROL', 'K'], onHotKey });
        press(document.body, { key: 'x', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        press(document.body, { key: 'k', code: 'KeyX', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('特殊键映射到对应的 code', () => {
        const onHotKey = hotKeyHandler();
        const { store } = mount({ hotKeys: ['Shift', 'Enter'], onHotKey });
        press(document.body, { code: 'Enter', shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);

        store.hotKeys = [HotKeys.Keys.Alt, HotKeys.Keys.ArrowUp];
        flushSync();
        press(document.body, { code: 'ArrowUp', altKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(2);

        store.hotKeys = [HotKeys.Keys.Space];
        flushSync();
        press(document.body, { code: 'Space' });
        expect(onHotKey).toHaveBeenCalledTimes(3);

        store.hotKeys = ['Shift', '/'];
        flushSync();
        press(document.body, { code: 'Slash', shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(4);
    });

    it('将 Keys 表暴露为静态成员', () => {
        expect(HotKeys.Keys.Control).toBe('control');
        expect(HotKeys.Keys.Meta).toBe('meta');
        expect(HotKeys.Keys.K).toBe('k');
        expect(HotKeys.Keys.F12).toBe('f12');
    });

    describe('无效组合', () => {
        const mountWith = (hotKeys: string[], onHotKey?: (event: KeyboardEvent) => void) => () => mount({ hotKeys, onHotKey });

        it('未知按键时抛出错误', () => {
            expect(mountWith(['Control', 'nope'])).toThrow('nope is not a valid key');
        });

        it('两个普通键时抛出错误', () => {
            expect(mountWith(['a', 'b'])).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('只有修饰键时抛出错误', () => {
            expect(mountWith(['Control', 'Shift'])).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('需要 Shift 才能输入的符号不是有效按键', () => {
            for (const key of ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '?']) {
                expect(mountWith([key])).toThrow(`${key} is not a valid key`);
            }
            expect(HotKeys.Keys).not.toHaveProperty('Exclamation');
            expect(HotKeys.Keys).not.toHaveProperty('RightParenthesis');
            expect(HotKeys.Keys.Slash).toBe('/');
        });

        it('组合键无效时不遗留监听', () => {
            const onHotKey = hotKeyHandler();
            expect(mountWith(['a', 'k'], onHotKey)).toThrow('HotKeys must have one common key and 0/some modifier key');
            press(document.body, { code: 'KeyK' });
            press(document.body, { code: 'KeyA' });
            expect(onHotKey).not.toHaveBeenCalled();
        });

        it('挂载后 hotKeys 变化为无效组合时同样报错', () => {
            const { store } = mount({ hotKeys: ['k'] });
            store.hotKeys = ['a', 'b'];
            expect(() => flushSync()).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('原地修改 hotKeys 数组时同样重新校验', () => {
            const { store } = mount({ hotKeys: ['k'] });
            store.hotKeys.push('j');
            expect(() => flushSync()).toThrow('HotKeys must have one common key and 0/some modifier key');
        });
    });

    it('仅在设置 preventDefault 且组合键匹配时阻止默认行为', () => {
        const { store } = mount({ hotKeys: ['Control', 's'] });
        expect(press(document.body, { code: 'KeyS', ctrlKey: true }).defaultPrevented).toBe(false);

        store.preventDefault = true;
        flushSync();
        expect(press(document.body, { code: 'KeyD', ctrlKey: true }).defaultPrevented).toBe(false);
        expect(press(document.body, { code: 'KeyS', ctrlKey: true }).defaultPrevented).toBe(true);
    });

    it('监听 getListenerTarget 返回的元素，而非 document.body', () => {
        const node = createTarget();
        const onHotKey = hotKeyHandler();
        mount({ getListenerTarget: () => node, hotKeys: ['Meta', 's'], onHotKey });
        press(document.body, { code: 'KeyS', metaKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(node, { code: 'KeyS', metaKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('getListenerTarget 返回 null 时回退到 document.body', () => {
        const onHotKey = hotKeyHandler();
        mount({ getListenerTarget: () => null, hotKeys: ['k'], onHotKey });
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('getListenerTarget 返回其他元素时移动监听', () => {
        const a = createTarget();
        const b = createTarget();
        const onHotKey = hotKeyHandler();
        const { store } = mount({ getListenerTarget: () => a, hotKeys: ['k'], onHotKey });
        store.getListenerTarget = () => b;
        flushSync();
        press(a, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
        press(b, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('目标变化后卸载时，从已绑定的元素上移除监听', () => {
        const a = createTarget();
        const b = createTarget();
        const onHotKey = hotKeyHandler();
        const { store, view } = mount({ getListenerTarget: () => a, hotKeys: ['k'], onHotKey });
        store.getListenerTarget = () => b;
        flushSync();
        view.unmount();
        press(a, { code: 'KeyK' });
        press(b, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
    });

    it('目标是兄弟元素的 bind:this 时，挂载时已能取到', () => {
        const view = render(TemplateRefTarget);
        const input = view.container.querySelector('input') as HTMLInputElement;
        press(input, { code: 'KeyK' });
        flushSync();
        expect(view.getByTestId('count')).toHaveTextContent('1');
    });

    it('卸载后停止监听', () => {
        const onHotKey = hotKeyHandler();
        const { view } = mount({ hotKeys: ['k'], onHotKey });
        view.unmount();
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
    });

    it('无需重新绑定即可读取最新的 hotKeys、preventDefault 与 onHotKey', () => {
        const first = hotKeyHandler();
        const second = hotKeyHandler();
        const { store } = mount({ hotKeys: ['a'], onHotKey: first });
        store.hotKeys = ['b'];
        store.preventDefault = true;
        store.onHotKey = second;
        flushSync();
        press(document.body, { code: 'KeyA' });
        expect(press(document.body, { code: 'KeyB' }).defaultPrevented).toBe(true);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

describe('HotKeys 渲染', () => {
    it('渲染以 "+" 连接的 hotKeys 分段', () => {
        const { view } = mount({ hotKeys: ['Control', 'Shift', 'k'] });
        const root = getRoot(view.container) as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect([...root.querySelectorAll(`.${prefix}-content`)].map((n) => n.textContent)).toEqual(['Control', 'Shift', 'k']);
        expect(root.querySelectorAll(`.${prefix}-split`)).toHaveLength(2);
        expect(root).toHaveTextContent('Control+Shift+k');
    });

    it('传入 content 时渲染 content 而非 hotKeys', () => {
        const { view } = mount({ content: ['Ctrl', 'B'], hotKeys: ['Control', 'b'] });
        expect(getRoot(view.container)).toHaveTextContent(/^Ctrl\+B$/);
    });

    it('children 渲染在根元素内，替换按键提示', () => {
        const { view } = mount({ class: 'custom', hotKeys: ['k'] }, true);
        const root = getRoot(view.container) as HTMLElement;
        expect(root).toHaveClass('custom');
        expect(root.querySelector('b.hint')).toHaveTextContent('Press K');
        expect(root.querySelector(`.${prefix}-content`)).toBeNull();
    });
});

describe('HotKeys 全局默认值', () => {
    const withGlobal = (overrideDefaultProps: SemiGlobal['config']['overrideDefaultProps']) => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = overrideDefaultProps;
        return new Map([[semiGlobalKey, semi]]);
    };

    it('preventDefault 读取全局默认值，显式属性优先', () => {
        const store = createStore<HotKeysProps>({ hotKeys: ['k'] });
        render(HotKeysHost, { context: withGlobal({ HotKeys: { preventDefault: true } }), props: { store } });
        expect(press(document.body, { code: 'KeyK' }).defaultPrevented).toBe(true);
        store.preventDefault = false;
        flushSync();
        expect(press(document.body, { code: 'KeyK' }).defaultPrevented).toBe(false);
    });

    it('getListenerTarget 读取全局函数默认值，显式 prop 优先', () => {
        const node = document.createElement('input');
        const other = document.createElement('textarea');
        document.body.append(node, other);
        const onHotKey = hotKeyHandler();
        const store = createStore<HotKeysProps>({ hotKeys: ['k'], onHotKey });
        render(HotKeysHost, { context: withGlobal({ HotKeys: { getListenerTarget: () => node } }), props: { store } });
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
        press(node, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        store.getListenerTarget = () => other;
        flushSync();
        press(node, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        press(other, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(2);
        node.remove();
        other.remove();
    });
});
