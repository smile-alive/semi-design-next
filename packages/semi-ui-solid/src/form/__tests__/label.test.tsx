import { type JSX, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type LabelProps, Form } from '..';

const Label = Form.Label;
const labelSelector = `.${BASE_CLASS_PREFIX}-form-field-label`;

describe('Form.Label', () => {
    it('class 与 style', () => {
        const { container } = render(() => <Label class="label-test" style={{ color: 'red' }} />);
        const label = container.querySelector('label.label-test');
        expect(label).not.toBeNull();
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('required 必填', () => {
        const { container } = render(() => <Label required />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-required`)).not.toBeNull();
    });

    it('text', () => {
        const [text, setText] = createSignal<JSX.Element>('semi');
        const { container } = render(() => <Label text={text()} />);
        expect(container).toHaveTextContent(/^semi$/);
        setText(0);
        expect(container).toHaveTextContent(/^0$/);
        setText(<div data-testid="node-text">semi</div>);
        expect(screen.getByTestId('node-text')).toHaveTextContent('semi');
    });

    it('text-align', () => {
        const { container } = render(() => <Label align="right" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).not.toBeNull();
    });

    it('width', () => {
        const { container } = render(() => <Label width={200} />);
        expect(container.querySelector(labelSelector)).toHaveStyle({ width: '200px' });
    });

    it('其他属性与 ref 透传到 label 元素，且不改动 style 属性', () => {
        let ref: HTMLLabelElement | undefined;
        const style = { color: 'red' };
        const { container } = render(() => <Label ref={(node) => (ref = node)} style={style} data-testid="label" width={100} />);
        const label = container.querySelector('label');
        expect(ref).toBe(label);
        expect(label).toHaveAttribute('data-testid', 'label');
        expect(label).toHaveStyle({ width: '100px', color: 'rgb(255, 0, 0)' });
        expect(style).toEqual({ color: 'red' });
    });

    it('字符串 style 与 width 合并', () => {
        const props: LabelProps = { style: 'color: red', width: '50%' };
        const { container } = render(() => <Label {...props} />);
        expect(container.querySelector('label')).toHaveStyle({ width: '50%', color: 'rgb(255, 0, 0)' });
    });

    it('optional 追加语言包文案', () => {
        const { container } = render(() => <Label optional text="name" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-optional-text`)).toHaveTextContent('（可选）');
    });

    it('optional 为 true 时不再加必填标记类', () => {
        const { container } = render(() => <Label required optional text="a" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-required`)).toBeNull();
    });

    it('没有 name 时不输出 for，name 优先于使用方传入的 for', () => {
        const [props, setProps] = createSignal<LabelProps>({});
        const { container } = render(() => <Label text="a" {...props()} />);
        expect(container.querySelector('label')).not.toHaveAttribute('for');
        setProps({ for: 'x' });
        expect(container.querySelector('label')).toHaveAttribute('for', 'x');
        setProps({ for: 'x', name: 'n' });
        expect(container.querySelector('label')).toHaveAttribute('for', 'n');
    });

    it('extra 有内容时渲染并加类名', () => {
        const { container } = render(() => <Label extra={0} text="a" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-extra`)).toHaveTextContent(/^0$/);
        expect(container.querySelector('label')).toHaveClass(`${BASE_CLASS_PREFIX}-form-field-label-with-extra`);
    });

    it('disabled', () => {
        const { container } = render(() => <Label disabled />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-disabled`)).not.toBeNull();
    });
});
