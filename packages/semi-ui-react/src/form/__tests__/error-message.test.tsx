import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { FormErrorMessage } from '@fibrae/semi-ui-react';

const ErrorMessage = FormErrorMessage;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;

describe('Form-errorMessage', () => {
    it('className 与 style', () => {
        const { container } = render(<ErrorMessage className="test" style={{ color: 'red' }} error={['semi error']} />);
        const em = container.querySelector('.test');
        expect(em).not.toBeNull();
        expect(em).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('error：单条错误', () => {
        const { container } = render(<ErrorMessage error={['semi error']} />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^semi error$/);
    });

    it('error：多条错误用逗号连接', () => {
        const { container } = render(<ErrorMessage error={['length error', 'size error']} />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^length error, size error$/);
    });

    it("error 为 [''] 时不渲染文本，也不渲染 helpText", () => {
        const { container } = render(<ErrorMessage error={['']} helpText="help" validateStatus="error" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('error 为空时只渲染 helpText，都没有时不渲染', () => {
        const { container, rerender } = render(<ErrorMessage helpText="help" />);
        expect(container.querySelector(emSelector)).toBeNull();
        expect(container).toHaveTextContent('help');
        rerender(<ErrorMessage />);
        expect(container).toBeEmptyDOMElement();
    });

    it('showValidateIcon 显示 validateStatus 对应的图标，helpText 使用帮助 id', () => {
        const { container, rerender } = render(<ErrorMessage error={['bad']} errorMessageId="em" helpTextId="ht" showValidateIcon validateStatus="warning" />);
        expect(container.querySelector('.semi-icon-alert_triangle')).not.toBeNull();
        expect(container.querySelector('#em')).toHaveTextContent('bad');
        rerender(<ErrorMessage errorMessageId="em" helpText="help" helpTextId="ht" showValidateIcon />);
        expect(container.querySelector('#ht')).toHaveTextContent('help');
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });

    it('其他属性与 ref 透传到根 div', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<ErrorMessage ref={ref} data-testid="em" error={['bad']} />);
        expect(ref.current).toBe(container.querySelector(emSelector));
        expect(ref.current).toHaveAttribute('data-testid', 'em');
    });
});
