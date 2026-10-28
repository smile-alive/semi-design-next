/** @jsxImportSource vue */
import { createTextVNode, type VNode } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import HotKeys from '../index';
import MutableKeys from './fixtures/mutable-keys.vue';
import TemplateRefTarget from './fixtures/template-ref-target.vue';

const prefix = `${BASE_CLASS_PREFIX}-hotKeys`;
const getRoot = (container: Element) => container.querySelector<HTMLElement>(`.${prefix}`);

// Dispatched by hand because the caller needs defaultPrevented, which Testing Library's async fireEvent drops.
function press(target: EventTarget, init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}
const hotKeyHandler = () => vi.fn<(event: KeyboardEvent) => void>();

describe('HotKeys', () => {
    it('class 与 style 落在根元素', () => {
        const view = render(HotKeys, {
            attrs: { id: 'test', class: 'test', style: 'color: red' },
            props: { hotKeys: ['r'] },
        });
        const hotKeys = getRoot(view.container);
        expect(hotKeys).toHaveClass('test');
        expect(hotKeys).toHaveStyle({ color: 'rgb(255, 0, 0)' });
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

    it('在 document.body 上按下组合键时，发出 hotKey 事件与键盘事件', () => {
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { hotKeys: [HotKeys.Keys.Control, 'k'], onHotKey } });
        press(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        expect(onHotKey.mock.calls[0]?.[0]).toBeInstanceOf(KeyboardEvent);
        expect(onHotKey.mock.calls[0]?.[0].code).toBe('KeyK');
    });

    it('接收从 document.body 后代冒泡上来的事件', () => {
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { hotKeys: ['Control', 'k'], onHotKey } });
        press(getRoot(view.container) as HTMLElement, { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('忽略 hotKeys 中按键的顺序', () => {
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { hotKeys: ['k', 'Shift', 'Meta'], onHotKey } });
        press(document.body, { code: 'KeyK', metaKey: true, shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('要求修饰键完全匹配，且普通键匹配', () => {
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { hotKeys: ['Control', 'k'], onHotKey } });
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
        render(HotKeys, { props: { hotKeys: ['r'], onHotKey } });
        press(document.body, { code: 'KeyR', shiftKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(document.body, { code: 'KeyR' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('按 event.code 而非 event.key 匹配按键，不区分大小写', () => {
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { hotKeys: ['CONTROL', 'K'], onHotKey } });
        press(document.body, { key: 'x', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        press(document.body, { key: 'k', code: 'KeyX', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('特殊键映射到对应的 code', async () => {
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { hotKeys: ['Shift', 'Enter'], onHotKey } });
        press(document.body, { code: 'Enter', shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);

        await view.rerender({ hotKeys: [HotKeys.Keys.Alt, HotKeys.Keys.ArrowUp] });
        press(document.body, { code: 'ArrowUp', altKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(2);

        await view.rerender({ hotKeys: [HotKeys.Keys.Space] });
        press(document.body, { code: 'Space' });
        expect(onHotKey).toHaveBeenCalledTimes(3);

        await view.rerender({ hotKeys: ['Shift', '/'] });
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
        // The check runs in onMounted; Testing Library's mount rethrows what a mounted hook throws.
        const mountWith = (hotKeys: string[], onHotKey?: (event: KeyboardEvent) => void) => () => render(HotKeys, { props: { hotKeys, onHotKey } });

        it('挂载抛错后不遗留容器 DOM', () => {
            const before = document.body.children.length;
            expect(mountWith(['a', 'b'])).toThrow('HotKeys must have one common key');
            expect(document.body.children).toHaveLength(before);
        });

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

        it('挂载后 hotKeys 变化时重新校验，未知按键同样上报', async () => {
            const errorHandler = vi.fn<(error: unknown) => void>();
            const view = render(HotKeys, { global: { config: { errorHandler } }, props: { hotKeys: ['k'] } });
            expect(errorHandler).not.toHaveBeenCalled();
            await view.rerender({ hotKeys: ['a', 'b'] });
            expect(errorHandler.mock.calls[0]?.[0]).toEqual(new Error('HotKeys must have one common key and 0/some modifier key'));
            await view.rerender({ hotKeys: ['Control', 'nope'] });
            expect(errorHandler.mock.calls[1]?.[0]).toEqual(new Error('nope is not a valid key'));
        });
    });

    it('仅在设置 preventDefault 且组合键匹配时阻止默认行为', async () => {
        const view = render(HotKeys, { props: { hotKeys: ['Control', 's'] } });
        expect(press(document.body, { code: 'KeyS', ctrlKey: true }).defaultPrevented).toBe(false);

        await view.rerender({ preventDefault: true });
        expect(press(document.body, { code: 'KeyD', ctrlKey: true }).defaultPrevented).toBe(false);
        expect(press(document.body, { code: 'KeyS', ctrlKey: true }).defaultPrevented).toBe(true);
    });

    it('监听 getListenerTarget 返回的元素，而非 document.body', () => {
        const node = createTarget();
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { getListenerTarget: () => node, hotKeys: ['Meta', 's'], onHotKey } });
        press(document.body, { code: 'KeyS', metaKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(node, { code: 'KeyS', metaKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('getListenerTarget 返回 null 时回退到 document.body', () => {
        const onHotKey = hotKeyHandler();
        render(HotKeys, { props: { getListenerTarget: () => null, hotKeys: ['k'], onHotKey } });
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('getListenerTarget 返回其他元素时移动监听', async () => {
        const a = createTarget();
        const b = createTarget();
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { getListenerTarget: () => a, hotKeys: ['k'], onHotKey } });
        await view.rerender({ getListenerTarget: () => b });
        press(a, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
        press(b, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('目标变化后卸载时，从已绑定的元素上移除监听', async () => {
        const a = createTarget();
        const b = createTarget();
        let target = a;
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { getListenerTarget: () => target, hotKeys: ['k'], onHotKey } });
        target = b;
        await view.rerender({ getListenerTarget: () => target });
        view.unmount();
        press(a, { code: 'KeyK' });
        press(b, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
    });

    it('目标是兄弟元素的模板 ref 时，挂载时已能取到', async () => {
        const view = render(TemplateRefTarget);
        const input = view.container.querySelector('input') as HTMLInputElement;
        press(input, { code: 'KeyK' });
        await vi.waitFor(() => expect(view.getByTestId('count')).toHaveTextContent('1'));
    });

    it('卸载后停止监听', () => {
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { hotKeys: ['k'], onHotKey } });
        view.unmount();
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
    });

    it('无需重新绑定即可读取最新的 hotKeys 与 preventDefault', async () => {
        const first = hotKeyHandler();
        const second = hotKeyHandler();
        const view = render(HotKeys, { props: { hotKeys: ['a'], onHotKey: first } });
        await view.rerender({ hotKeys: ['b'], preventDefault: true, onHotKey: second });
        press(document.body, { code: 'KeyA' });
        expect(press(document.body, { code: 'KeyB' }).defaultPrevented).toBe(true);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('原地修改 hotKeys 数组时同样重新校验', async () => {
        const errorHandler = vi.fn<(error: unknown) => void>();
        let instance: { push: (key: string) => void } | undefined;
        render(() => <MutableKeys ref={(value) => (instance = value as unknown as typeof instance)} />, {
            global: { config: { errorHandler } },
        });
        expect(errorHandler).not.toHaveBeenCalled();
        instance?.push('j');
        await vi.waitFor(() => expect(errorHandler.mock.calls[0]?.[0]).toEqual(new Error('HotKeys must have one common key and 0/some modifier key')));
    });

    it('渲染以 "+" 连接的 hotKeys 分段', () => {
        const view = render(HotKeys, { props: { hotKeys: ['Control', 'Shift', 'k'] } });
        const root = getRoot(view.container) as HTMLElement;
        expect(root.tagName).toBe('DIV');
        expect([...root.querySelectorAll(`.${prefix}-content`)].map((n) => n.textContent)).toEqual(['Control', 'Shift', 'k']);
        expect(root.querySelectorAll(`.${prefix}-split`)).toHaveLength(2);
        expect(root).toHaveTextContent('Control+Shift+k');
    });

    it('传入 content 时渲染 content 而非 hotKeys', () => {
        const view = render(HotKeys, { props: { content: ['Ctrl', 'B'], hotKeys: ['Control', 'b'] } });
        expect(getRoot(view.container)).toHaveTextContent(/^Ctrl\+B$/);
    });

    it('默认插槽的内容渲染在根元素内，替换按键提示', () => {
        const slot = vi.fn<() => VNode>(() => <b class="r">Press K</b>);
        const view = render(HotKeys, {
            attrs: { class: 'custom' },
            props: { hotKeys: ['k'] },
            slots: { default: slot },
        });
        const root = getRoot(view.container) as HTMLElement;
        expect(root).toHaveClass('custom');
        expect(root.querySelector('b.r')).toHaveTextContent('Press K');
        expect(root.querySelector(`.${prefix}-content`)).toBeNull();
        expect(slot.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('默认插槽为空时不渲染内容，但仍保持监听', () => {
        const onHotKey = hotKeyHandler();
        for (const slots of [{ default: () => [] }, { default: () => createTextVNode('') }]) {
            const view = render(HotKeys, { props: { hotKeys: ['k'], onHotKey }, slots });
            expect(getRoot(view.container)).toBeNull();
            view.unmount();
        }
        render(HotKeys, { props: { hotKeys: ['k'], onHotKey }, slots: { default: () => [] } });
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('没有根元素时不产生 Vue 告警', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        render(HotKeys, {
            attrs: { class: 'a', style: 'color: red', id: 'x' },
            props: { hotKeys: ['k'] },
            slots: { default: () => [] },
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('点击根元素时 click 作为原生属性落到根元素', async () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const view = render(HotKeys, { attrs: { onClick }, props: { hotKeys: ['k'] } });
        await fireEvent.click(getRoot(view.container) as HTMLElement);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0]?.[0].type).toBe('click');
    });

    it('data-* 属性透传到根元素，含自定义内容时同样', () => {
        const view = render(HotKeys, { attrs: { 'data-testid': 'hk' }, props: { hotKeys: ['k'] } });
        expect(getRoot(view.container)).toHaveAttribute('data-testid', 'hk');
        const custom = render(HotKeys, {
            attrs: { 'data-testid': 'hk2' },
            props: { hotKeys: ['k'] },
            slots: { default: () => 'x' },
        });
        expect(getRoot(custom.container)).toHaveAttribute('data-testid', 'hk2');
    });

    it('不把组件属性放到根元素上', () => {
        const view = render(HotKeys, {
            props: { content: ['K'], hotKeys: ['k'], preventDefault: true, onHotKey: () => undefined },
        });
        const root = getRoot(view.container);
        for (const name of ['hotkeys', 'content', 'preventdefault', 'onhotkey']) {
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('其他未知属性透传到根元素', () => {
        const view = render(HotKeys, {
            attrs: { id: 'hk', 'aria-label': 'Search', title: 't' },
            props: { hotKeys: ['k'] },
        });
        const root = getRoot(view.container);
        expect(root).toHaveAttribute('id', 'hk');
        expect(root).toHaveAttribute('aria-label', 'Search');
        expect(root).toHaveAttribute('title', 't');
    });

    it('组件 ref 的 $el 是根元素', () => {
        let instance: { $el: Element } | undefined;
        const view = render(() => <HotKeys hotKeys={['k']} ref={(value) => (instance = value as typeof instance)} />);
        expect(instance?.$el).toBe(getRoot(view.container));
    });
});

describe('HotKeys 全局默认值', () => {
    it('preventDefault 读取全局默认值，显式属性优先', async () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { HotKeys: { preventDefault: true } };
        const global = { provide: { [semiGlobalKey]: semi } };
        const view = render(HotKeys, { global, props: { hotKeys: ['k'] } });
        expect(press(document.body, { code: 'KeyK' }).defaultPrevented).toBe(true);
        await view.rerender({ preventDefault: false });
        expect(press(document.body, { code: 'KeyK' }).defaultPrevented).toBe(false);
    });

    it('getListenerTarget 读取全局函数默认值，显式 prop 优先', async () => {
        const node = document.createElement('input');
        const other = document.createElement('textarea');
        document.body.append(node, other);
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { HotKeys: { getListenerTarget: () => node } };
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, {
            global: { provide: { [semiGlobalKey]: semi } },
            props: { hotKeys: ['k'], onHotKey },
        });
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
        press(node, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        await view.rerender({ getListenerTarget: () => other });
        press(node, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        press(other, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(2);
        node.remove();
        other.remove();
    });

    it('单向绑定 hotKeys 变化后新组合键立刻生效', async () => {
        const onHotKey = hotKeyHandler();
        const view = render(HotKeys, { props: { hotKeys: ['a'], onHotKey } });
        await view.rerender({ hotKeys: ['b'] });
        press(document.body, { code: 'KeyB' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });
});
