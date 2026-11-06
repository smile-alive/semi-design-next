import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type ErrorMessageProps, Form } from '..';

const ErrorMessage = Form.ErrorMessage;
const emSelector = `.${BASE_CLASS_PREFIX}-form-field-error-message`;

describe('Form-errorMessage', () => {
    it('class 与 style', () => {
        const { container } = render(() => <ErrorMessage class="test" style={{ color: 'red' }} error={['semi error']} />);
        const em = container.querySelector('.test');
        expect(em).not.toBeNull();
        expect(em).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('error：一条消息', () => {
        const { container } = render(() => <ErrorMessage error={['semi error']} />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^semi error$/);
    });

    it('error：多条消息用逗号连接，空消息不显示', () => {
        const { container } = render(() => <ErrorMessage error={['length error', '', 'size error']} />);
        expect(container.querySelector(`${emSelector} span`)).toHaveTextContent(/^length error, size error$/);
    });

    it("error 为 [''] 时不渲染文本，也不渲染 helpText", () => {
        const { container } = render(() => <ErrorMessage error={['']} helpText="help" validateStatus="error" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('error 为 undefined 或空数组时显示 helpText', () => {
        const { container, unmount } = render(() => <ErrorMessage helpText="help" />);
        expect(container).toHaveTextContent('help');
        expect(container.querySelector(emSelector)).toBeNull();
        unmount();
        const { container: empty } = render(() => <ErrorMessage error={[]} helpText="help" />);
        expect(empty).toHaveTextContent('help');
    });

    it('showValidateIcon 显示 validateStatus 对应的图标，helpText 使用帮助 id', () => {
        const { container, unmount } = render(() => <ErrorMessage error={['bad']} errorMessageId="em" helpTextId="ht" showValidateIcon validateStatus="warning" />);
        expect(container.querySelector('.semi-icon-alert_triangle')).not.toBeNull();
        expect(container.querySelector('#em')).toHaveTextContent('bad');
        unmount();
        const { container: help } = render(() => <ErrorMessage errorMessageId="em" helpText="help" helpTextId="ht" showValidateIcon />);
        expect(help.querySelector('#ht')).toHaveTextContent('help');
        expect(help.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });

    it('其他属性与 ref 透传到根 div', () => {
        let ref: HTMLDivElement | undefined;
        const props = { 'data-testid': 'em', error: ['bad'] } as ErrorMessageProps;
        const { container } = render(() => <ErrorMessage ref={(el) => (ref = el)} {...props} />);
        expect(ref).toBe(container.querySelector(emSelector));
        expect(ref).toHaveAttribute('data-testid', 'em');
    });
});
