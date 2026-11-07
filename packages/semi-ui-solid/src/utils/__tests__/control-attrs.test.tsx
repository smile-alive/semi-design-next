import { createSignal, splitProps } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { isNativeInputKey, omitFormInjected, splitControlAttrs } from '../control-attrs';

type Attrs = Record<string, string>;

const isAriaKey = (key: string): key is `aria-${string}` => key.startsWith('aria-');

// Mirrors how a component uses the split: each half is spread onto its own element
function Probe(props: Attrs) {
    const [control, root] = splitControlAttrs(props, isAriaKey);
    return (
        <div data-testid="root" {...root}>
            <input data-testid="control" {...control} />
        </div>
    );
}

describe('splitControlAttrs', () => {
    it('按谓词分到控件与根元素，互不重叠', () => {
        render(() => <Probe aria-label="a" title="t" />);
        expect(screen.getByTestId('control')).toHaveAttribute('aria-label', 'a');
        expect(screen.getByTestId('control')).not.toHaveAttribute('title');
        expect(screen.getByTestId('root')).toHaveAttribute('title', 't');
        expect(screen.getByTestId('root')).not.toHaveAttribute('aria-label');
    });

    it('创建之后出现或消失的键随之移入或移出', () => {
        const [attrs, setAttrs] = createSignal<Attrs>({ title: 't' });
        render(() => <Probe {...attrs()} />);
        setAttrs({ title: 't', 'aria-label': 'a' });
        expect(screen.getByTestId('control')).toHaveAttribute('aria-label', 'a');
        expect(screen.getByTestId('root')).not.toHaveAttribute('aria-label');
        setAttrs({ 'aria-label': 'b' });
        expect(screen.getByTestId('control')).toHaveAttribute('aria-label', 'b');
        expect(screen.getByTestId('root')).not.toHaveAttribute('title');
        setAttrs({});
        expect(screen.getByTestId('control')).not.toHaveAttribute('aria-label');
    });

    it('值保持响应式', () => {
        const [label, setLabel] = createSignal('a');
        render(() => <Probe aria-label={label()} title={label()} />);
        setLabel('b');
        expect(screen.getByTestId('control')).toHaveAttribute('aria-label', 'b');
        expect(screen.getByTestId('root')).toHaveAttribute('title', 'b');
    });

    it('两半只读：写入或冻结抛 TypeError，之后展开照常', () => {
        const [control, root] = splitControlAttrs({ 'aria-label': 'a', title: 't' } as Attrs, isAriaKey);
        expect(() => Object.assign(control, { 'aria-label': 'b' })).toThrow(TypeError);
        expect(() => delete (root as Partial<Attrs>).title).toThrow(TypeError);
        expect(() => Object.freeze(root)).toThrow(TypeError);
        expect({ ...control, ...root }).toEqual({ 'aria-label': 'a', title: 't' });
    });

    it('结果可继续交给 splitProps', () => {
        function Chained(props: Attrs) {
            const [, root] = splitControlAttrs(props, isAriaKey);
            const [own, rest] = splitProps(root, ['id']);
            return <div data-testid="root" id={own.id} {...rest} />;
        }
        const [attrs, setAttrs] = createSignal<Attrs>({ id: 'x', 'aria-label': 'a' });
        render(() => <Chained {...attrs()} />);
        expect(screen.getByTestId('root')).toHaveAttribute('id', 'x');
        expect(screen.getByTestId('root')).not.toHaveAttribute('aria-label');
        setAttrs({ id: 'x', title: 't' });
        expect(screen.getByTestId('root')).toHaveAttribute('title', 't');
    });
});

describe('omitFormInjected', () => {
    it('丢弃 Form 注入的键，保留其余并随之更新', () => {
        function Field(props: Attrs) {
            return <div data-testid="root" {...omitFormInjected(props)} />;
        }
        const [attrs, setAttrs] = createSignal<Attrs>({ validateStatus: 'error', title: 't' });
        render(() => <Field {...attrs()} />);
        expect(screen.getByTestId('root')).toHaveAttribute('title', 't');
        expect(screen.getByTestId('root')).not.toHaveAttribute('validateStatus');
        setAttrs({ insetLabel: 'L', insetLabelId: 'id', title: 'u' });
        expect(screen.getByTestId('root')).toHaveAttribute('title', 'u');
        expect(screen.getByTestId('root').getAttributeNames().sort()).toEqual(['data-testid', 'title']);
    });
});

describe('isNativeInputKey', () => {
    it.each(['aria-label', 'aria-invalid', 'id', 'name', 'tabIndex', 'tabindex', 'autofocus', 'onFocus', 'onBlur'])('%s 属于原生控件', (key) => {
        expect(isNativeInputKey(key)).toBe(true);
    });

    it.each(['class', 'style', 'title', 'data-x', 'onClick', 'role'])('%s 不属于原生控件', (key) => {
        expect(isNativeInputKey(key)).toBe(false);
    });
});
