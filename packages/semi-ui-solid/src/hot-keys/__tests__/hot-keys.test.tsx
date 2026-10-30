import { createSignal } from 'solid-js';
import { fireEvent, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import HotKeys, { type HotKeysProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefix = `${BASE_CLASS_PREFIX}-hotKeys`;

const rootOf = (container: HTMLElement) => container.querySelector(`.${prefix}`) as HTMLElement;

const press = (target: Element, init: KeyboardEventInit) => fireEvent.keyDown(target, init);

type HotKeyHandler = (e: KeyboardEvent) => void;

function createTarget() {
    const node = document.createElement('input');
    document.body.append(node);
    return node;
}

describe('HotKeys', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
        document.body.replaceChildren();
    });

    it('类型：不接受 children，内容由 render 与 content 给出', () => {
        expectTypeOf<'children'>().not.toExtend<keyof HotKeysProps>();
    });

    it('HotKeys 自定义 class 与 style', () => {
        const { container } = render(() => <HotKeys id="test" class="test" style={{ color: 'red' }} hotKeys={['r']} />);

        const hotKeys = container.querySelector(`.${prefix}`);
        expect(hotKeys).toHaveClass('test');
        expect(hotKeys).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('在 document.body 上按下组合键时，以键盘事件调用 onHotKey', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys hotKeys={[HotKeys.Keys.Control, 'k']} onHotKey={onHotKey} />);
        press(document.body, { key: 'k', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        expect(onHotKey.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
        expect(onHotKey.mock.calls[0][0].code).toBe('KeyK');
    });

    it('接收从 document.body 后代冒泡上来的事件', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        const { container } = render(() => <HotKeys hotKeys={['Control', 'k']} onHotKey={onHotKey} />);
        press(rootOf(container), { code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('忽略 hotKeys 中按键的顺序', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys hotKeys={['k', 'Shift', 'Meta']} onHotKey={onHotKey} />);
        press(document.body, { code: 'KeyK', metaKey: true, shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('要求修饰键完全匹配，且普通键匹配', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys hotKeys={['Control', 'k']} onHotKey={onHotKey} />);
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
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys hotKeys={['r']} onHotKey={onHotKey} />);
        press(document.body, { code: 'KeyR', shiftKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(document.body, { code: 'KeyR' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('按 event.code 而非 event.key 匹配按键，不区分大小写', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys hotKeys={['CONTROL', 'K']} onHotKey={onHotKey} />);
        press(document.body, { key: 'x', code: 'KeyK', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
        press(document.body, { key: 'k', code: 'KeyX', ctrlKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('特殊键映射到对应的 code', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        const [hotKeys, setHotKeys] = createSignal<string[]>(['Shift', 'Enter']);
        render(() => <HotKeys hotKeys={hotKeys()} onHotKey={onHotKey} />);
        press(document.body, { code: 'Enter', shiftKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);

        setHotKeys([HotKeys.Keys.Alt, HotKeys.Keys.ArrowUp]);
        press(document.body, { code: 'ArrowUp', altKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(2);

        setHotKeys([HotKeys.Keys.Space]);
        press(document.body, { code: 'Space' });
        expect(onHotKey).toHaveBeenCalledTimes(3);

        setHotKeys(['Shift', '/']);
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
        beforeEach(() => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('未知按键时抛出错误', () => {
            expect(() => render(() => <HotKeys hotKeys={['Control', 'nope']} />)).toThrow('nope is not a valid key');
        });

        it('两个普通键时抛出错误', () => {
            expect(() => render(() => <HotKeys hotKeys={['a', 'b']} />)).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('只有修饰键时抛出错误', () => {
            expect(() => render(() => <HotKeys hotKeys={['Control', 'Shift']} />)).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('需要 Shift 才能输入的符号不是有效按键', () => {
            for (const key of ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '?']) {
                expect(() => render(() => <HotKeys hotKeys={[key]} />)).toThrow(`${key} is not a valid key`);
            }
            expect(HotKeys.Keys).not.toHaveProperty('Exclamation');
            expect(HotKeys.Keys).not.toHaveProperty('RightParenthesis');
            expect(HotKeys.Keys.Slash).toBe('/');
        });

        it('组合键无效时不遗留监听', () => {
            const onHotKey = vi.fn<HotKeyHandler>();
            expect(() => render(() => <HotKeys hotKeys={['a', 'k']} onHotKey={onHotKey} />)).toThrow('HotKeys must have one common key and 0/some modifier key');
            press(document.body, { code: 'KeyK' });
            press(document.body, { code: 'KeyA' });
            expect(onHotKey).not.toHaveBeenCalled();
        });

        it('挂载后 hotKeys 变化时重新校验', () => {
            const [hotKeys, setHotKeys] = createSignal(['k']);
            render(() => <HotKeys hotKeys={hotKeys()} />);
            expect(() => setHotKeys(['a', 'b'])).toThrow('HotKeys must have one common key and 0/some modifier key');
        });

        it('挂载后设置未知按键时上报错误', () => {
            const [hotKeys, setHotKeys] = createSignal(['k']);
            render(() => <HotKeys hotKeys={hotKeys()} />);
            expect(() => setHotKeys(['Control', 'nope'])).toThrow('nope is not a valid key');
        });
    });

    it('仅在设置 preventDefault 且组合键匹配时阻止默认行为', () => {
        const [prevent, setPrevent] = createSignal(false);
        render(() => <HotKeys hotKeys={['Control', 's']} preventDefault={prevent()} />);
        expect(press(document.body, { code: 'KeyS', ctrlKey: true })).toBe(true);

        setPrevent(true);
        expect(press(document.body, { code: 'KeyD', ctrlKey: true })).toBe(true);
        expect(press(document.body, { code: 'KeyS', ctrlKey: true })).toBe(false);
    });

    it('监听 getListenerTarget 返回的元素，而非 document.body', () => {
        const node = createTarget();
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys getListenerTarget={() => node} hotKeys={['Meta', 's']} onHotKey={onHotKey} />);
        press(document.body, { code: 'KeyS', metaKey: true });
        expect(onHotKey).not.toHaveBeenCalled();
        press(node, { code: 'KeyS', metaKey: true });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('getListenerTarget 返回 null 时回退到 document.body', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        render(() => <HotKeys getListenerTarget={() => null} hotKeys={['k']} onHotKey={onHotKey} />);
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(1);
    });

    it('卸载后停止监听', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        const { unmount } = render(() => <HotKeys hotKeys={['k']} onHotKey={onHotKey} />);
        unmount();
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).not.toHaveBeenCalled();
    });

    it('无需重新绑定即可读取最新的 hotKeys、onHotKey 与 preventDefault', () => {
        const first = vi.fn<HotKeyHandler>();
        const second = vi.fn<HotKeyHandler>();
        const [props, setProps] = createSignal<HotKeysProps>({ hotKeys: ['a'], onHotKey: first });
        render(() => <HotKeys {...props()} />);
        setProps({ hotKeys: ['b'], preventDefault: true, onHotKey: second });
        press(document.body, { code: 'KeyA' });
        expect(press(document.body, { code: 'KeyB' })).toBe(false);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('渲染以 "+" 连接的 hotKeys 分段', () => {
        const { container } = render(() => <HotKeys hotKeys={['Control', 'Shift', 'k']} />);
        const root = rootOf(container);
        expect(root.tagName).toBe('DIV');
        expect([...root.querySelectorAll(`.${prefix}-content`)].map((n) => n.textContent)).toEqual(['Control', 'Shift', 'k']);
        expect(root.querySelectorAll(`.${prefix}-split`)).toHaveLength(2);
        expect(root).toHaveTextContent('Control+Shift+k');
    });

    it('传入 content 时渲染 content 而非 hotKeys', () => {
        const { container } = render(() => <HotKeys content={['Ctrl', 'B']} hotKeys={['Control', 'b']} />);
        expect(container.querySelector(`.${prefix}`)).toHaveTextContent(/^Ctrl\+B$/);
    });

    it('在根元素内渲染 render 函数的结果', () => {
        const { container } = render(() => <HotKeys class="custom" hotKeys={['k']} render={() => <b class="r">Press K</b>} />);
        const root = rootOf(container);
        expect(root).toHaveClass('custom');
        expect(root.querySelector('b.r')).toHaveTextContent('Press K');
        expect(root.querySelector(`.${prefix}-content`)).toBeNull();
    });

    it('在根元素内渲染 render 节点', () => {
        const { container } = render(() => <HotKeys hotKeys={['k']} render={<i class="node">K</i>} />);
        expect(container.querySelector(`.${prefix} i.node`)).toHaveTextContent('K');
    });

    it('render 为 null 或返回 null 时不渲染内容，但仍保持监听', () => {
        const onHotKey = vi.fn<HotKeyHandler>();
        const nullNode = render(() => <HotKeys hotKeys={['k']} render={null} onHotKey={onHotKey} />);
        expect(nullNode.container).toBeEmptyDOMElement();
        const nullFunction = render(() => <HotKeys hotKeys={['k']} render={() => null} onHotKey={onHotKey} />);
        expect(nullFunction.container).toBeEmptyDOMElement();
        press(document.body, { code: 'KeyK' });
        expect(onHotKey).toHaveBeenCalledTimes(2);
    });

    it('点击根元素时调用 onClick 并传入鼠标事件', () => {
        const onClick = vi.fn<(e: MouseEvent) => void>();
        const { container } = render(() => <HotKeys hotKeys={['k']} onClick={onClick} />);
        fireEvent.click(rootOf(container));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].type).toBe('click');
    });

    it('data-* 属性透传到根元素', () => {
        const [testId, setTestId] = createSignal('hk');
        const [custom, setRender] = createSignal<(() => string) | undefined>();
        const { container } = render(() => <HotKeys data-testid={testId()} hotKeys={['k']} render={custom()} />);
        expect(container.querySelector(`.${prefix}`)).toHaveAttribute('data-testid', 'hk');
        setTestId('hk2');
        setRender(() => () => 'x');
        expect(container.querySelector(`.${prefix}`)).toHaveAttribute('data-testid', 'hk2');
        expect(container.querySelector(`.${prefix}`)).toHaveTextContent(/^x$/);
    });

    it('不把组件属性放到根元素上', () => {
        const { container } = render(() => <HotKeys content={['K']} hotKeys={['k']} preventDefault onHotKey={() => {}} />);
        const root = rootOf(container);
        for (const name of ['hotkeys', 'content', 'preventdefault', 'onhotkey']) {
            expect(root).not.toHaveAttribute(name);
        }
    });

    it('其他未知属性透传到根元素', () => {
        const { container } = render(() => <HotKeys id="hk" aria-label="Search" title="t" hotKeys={['k']} />);
        const root = container.querySelector(`.${prefix}`);
        expect(root).toHaveAttribute('id', 'hk');
        expect(root).toHaveAttribute('aria-label', 'Search');
        expect(root).toHaveAttribute('title', 't');
    });

    it('ref 挂载到根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <HotKeys ref={(node) => (ref = node)} hotKeys={['k']} />);
        expect(ref).toBe(container.querySelector(`.${prefix}`));
    });

    it('只调用一次 render 函数', () => {
        const renderFn = vi.fn<() => string>(() => 'K');
        render(() => <HotKeys hotKeys={['k']} render={renderFn} />);
        expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it('读取全局默认属性', () => {
        semiGlobal.config.overrideDefaultProps = { HotKeys: { preventDefault: true, class: 'global' } };
        const { container } = render(() => <HotKeys hotKeys={['k']} />);
        expect(container.querySelector(`.${prefix}`)).toHaveClass('global');
        expect(press(document.body, { code: 'KeyK' })).toBe(false);
    });

    describe('监听目标', () => {
        it('getListenerTarget 返回其他元素时移动监听', () => {
            const a = createTarget();
            const b = createTarget();
            const onHotKey = vi.fn<HotKeyHandler>();
            const [target, setTarget] = createSignal(a);
            render(() => <HotKeys getListenerTarget={() => target()} hotKeys={['k']} onHotKey={onHotKey} />);
            setTarget(b);
            press(a, { code: 'KeyK' });
            expect(onHotKey).not.toHaveBeenCalled();
            press(b, { code: 'KeyK' });
            expect(onHotKey).toHaveBeenCalledTimes(1);
        });

        it('getListenerTarget 换成另一个函数时移动监听', () => {
            const a = createTarget();
            const b = createTarget();
            const onHotKey = vi.fn<HotKeyHandler>();
            const [getTarget, setGetTarget] = createSignal(() => a);
            render(() => <HotKeys getListenerTarget={getTarget()} hotKeys={['k']} onHotKey={onHotKey} />);
            setGetTarget(() => () => b);
            press(a, { code: 'KeyK' });
            expect(onHotKey).not.toHaveBeenCalled();
            press(b, { code: 'KeyK' });
            expect(onHotKey).toHaveBeenCalledTimes(1);
        });

        it('getListenerTarget 读取父容器的 ref 时，只在容器内触发', () => {
            const onHotKey = vi.fn<HotKeyHandler>();
            const outside = createTarget();
            function Panel() {
                let container: HTMLDivElement | undefined;
                return (
                    <div ref={(node) => (container = node)} data-testid="panel">
                        <HotKeys getListenerTarget={() => container} hotKeys={['k']} onHotKey={onHotKey} />
                    </div>
                );
            }
            const view = render(() => <Panel />);
            press(outside, { code: 'KeyK' });
            expect(onHotKey).not.toHaveBeenCalled();
            press(view.getByTestId('panel'), { code: 'KeyK' });
            expect(onHotKey).toHaveBeenCalledTimes(1);
        });

        it('目标变化后卸载时，从已绑定的元素上移除监听', () => {
            const a = createTarget();
            const b = createTarget();
            const onHotKey = vi.fn<HotKeyHandler>();
            const [target, setTarget] = createSignal(a);
            const { unmount } = render(() => <HotKeys getListenerTarget={() => target()} hotKeys={['k']} onHotKey={onHotKey} />);
            setTarget(b);
            unmount();
            press(a, { code: 'KeyK' });
            press(b, { code: 'KeyK' });
            expect(onHotKey).not.toHaveBeenCalled();
        });
    });
});
