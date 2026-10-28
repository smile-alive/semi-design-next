import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form } from '@fibrae/semi-ui-react';

const Label = Form.Label;
const labelSelector = `.${BASE_CLASS_PREFIX}-form-field-label`;

describe('Form.Label', () => {
    it('className 与 style', () => {
        const { container } = render(<Label className="label-test" style={{ color: 'red' }} />);
        const label = container.querySelector('label.label-test');
        expect(label).not.toBeNull();
        expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('required 必填', () => {
        const { container } = render(<Label required />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-required`)).not.toBeNull();
    });

    it('text', () => {
        const { container, rerender } = render(<Label text="semi" />);
        expect(container).toHaveTextContent(/^semi$/);

        rerender(<Label text={0} />);
        expect(container).toHaveTextContent(/^0$/);

        rerender(<Label text={<div data-testid="node-text">semi</div>} />);
        expect(screen.getByTestId('node-text')).toHaveTextContent('semi');
    });

    it('text-align', () => {
        const { container } = render(<Label align="right" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-right`)).not.toBeNull();
    });

    it('width', () => {
        const { container } = render(<Label width={200} />);
        expect(container.querySelector(labelSelector)).toHaveStyle({ width: '200px' });
    });

    it('其他属性与 ref 透传到 label 元素，且不改动 style 属性', () => {
        const ref = createRef<HTMLLabelElement>();
        const style = { color: 'red' };
        const { container } = render(<Label ref={ref} style={style} data-testid="label" width={100} />);
        const label = container.querySelector('label');
        expect(ref.current).toBe(label);
        expect(label).toHaveAttribute('data-testid', 'label');
        expect(label).toHaveStyle({ width: '100px', color: 'rgb(255, 0, 0)' });
        expect(style).toEqual({ color: 'red' });
    });

    it('optional 追加语言包文案', () => {
        const { container } = render(<Label optional text="name" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-optional-text`)).toHaveTextContent('（可选）');
    });

    it('optional 为 true 时不再加必填标记类', () => {
        const { container } = render(<Label required optional text="a" />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-required`)).toBeNull();
    });

    it('没有 name 时不输出 for', () => {
        const { container, rerender } = render(<Label text="a" />);
        expect(container.querySelector('label')).not.toHaveAttribute('for');
        rerender(<Label name="n" text="a" />);
        expect(container.querySelector('label')).toHaveAttribute('for', 'n');
    });

    it('没有 name 时使用方传入的 htmlFor 生效，name 优先', () => {
        const { container, rerender } = render(<Label htmlFor="x" text="a" />);
        expect(container.querySelector('label')).toHaveAttribute('for', 'x');
        rerender(<Label name="n" htmlFor="x" text="a" />);
        expect(container.querySelector('label')).toHaveAttribute('for', 'n');
    });

    it('disabled', () => {
        const { container } = render(<Label disabled />);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-form-field-label-disabled`)).not.toBeNull();
    });
});
