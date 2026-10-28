import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Form } from '@fibrae/semi-ui-react';

const ErrorMessage = Form.ErrorMessage;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;

describe('Form-errorMessage', () => {
    it('className 与 style', () => {
        const { container } = render(<ErrorMessage className="test" style={{ color: 'red' }} error="semi error" />);
        const em = container.querySelector('.test');
        expect(em).not.toBeNull();
        expect(em).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('error：字符串', () => {
        const { container } = render(<ErrorMessage error="semi error" />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^semi error$/);
    });
    it('error：字符串数组', () => {
        const arrayError = ['length error', 'size error'];
        const { container } = render(<ErrorMessage error={arrayError} />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^length error, size error$/);
    });
    it('error：reactNode', () => {
        const { container } = render(<ErrorMessage error={<div data-testid="node-error">semi error</div>} />);
        expect(container.querySelector(emSelector)).toContainElement(screen.getByTestId('node-error'));
    });

    it('error：null', () => {
        const { container } = render(<ErrorMessage error={null} />);
        expect(container.querySelector(emSelector)).toBeNull();
    });
    it('showValidateIcon 显示 validateStatus 对应的图标，helpText 使用帮助 id', () => {
        const { container, rerender } = render(<ErrorMessage error="bad" errorMessageId="em" helpTextId="ht" showValidateIcon validateStatus="warning" />);
        expect(container.querySelector('.semi-icon-alert_triangle')).not.toBeNull();
        expect(container.querySelector('#em')).toHaveTextContent('bad');
        rerender(<ErrorMessage errorMessageId="em" helpText="help" helpTextId="ht" showValidateIcon />);
        expect(container.querySelector('#ht')).toHaveTextContent('help');
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });

    it('其他属性与 ref 透传到根 div', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<ErrorMessage ref={ref} data-testid="em" error="bad" />);
        expect(ref.current).toBe(container.querySelector(emSelector));
        expect(ref.current).toHaveAttribute('data-testid', 'em');
    });
});
