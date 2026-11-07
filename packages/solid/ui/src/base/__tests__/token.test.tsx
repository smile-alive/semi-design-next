import { type JSX, children, createEffect, createSignal, For } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createToken, isToken } from '../token';

interface ItemProps {
    label?: string;
    children?: JSX.Element;
}

function Item(props: ItemProps) {
    return createToken('List.Item', props);
}

function List(props: { children?: JSX.Element; onRead: (labels: (string | undefined)[]) => void }) {
    const resolved = children(() => props.children);
    const items = () => resolved.toArray().filter((node) => isToken<ItemProps>(node, 'List.Item'));
    createEffect(() => props.onRead(items().map((item) => item.props.label)));
    return <ul />;
}

describe('token', () => {
    it('token 是对象，穿过 children() 时不被调用，按标签收集', () => {
        const onRead = vi.fn<(labels: (string | undefined)[]) => void>();
        render(() => (
            <List onRead={onRead}>
                <Item label="a" />
                text
                <span>dom</span>
                <For each={['b', 'c']}>{(label) => <Item label={label} />}</For>
            </List>
        ));
        expect(onRead).toHaveBeenLastCalledWith(['a', 'b', 'c']);
    });

    it('isToken 区分标签、DOM、字符串与 null', () => {
        const token = createToken('List.Item', {});
        expect(isToken(token, 'List.Item')).toBe(true);
        expect(isToken(token, 'Other.Item')).toBe(false);
        expect(isToken(document.createElement('div'), 'List.Item')).toBe(false);
        expect(isToken('List.Item', 'List.Item')).toBe(false);
        expect(isToken(null, 'List.Item')).toBe(false);
        expect(isToken({ props: {} }, 'List.Item')).toBe(false);
    });

    it('token.props 是子组件收到的活对象：子项 prop 变化后父组件读到新值，不重新创建子组件', () => {
        const [label, setLabel] = createSignal('a');
        const body = vi.fn<() => void>();
        const onRead = vi.fn<(labels: (string | undefined)[]) => void>();
        function SpyItem(props: ItemProps) {
            body();
            return <Item {...props} />;
        }
        render(() => (
            <List onRead={onRead}>
                <SpyItem label={label()} />
            </List>
        ));
        expect(onRead).toHaveBeenLastCalledWith(['a']);
        setLabel('b');
        expect(onRead).toHaveBeenLastCalledWith(['b']);
        expect(body).toHaveBeenCalledTimes(1);
    });

    it('单独插入的 token 不渲染任何内容', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <div>
                <Item label="a" />
            </div>
        ));
        expect(container.firstElementChild).toBeEmptyDOMElement();
        warn.mockRestore();
    });
});
