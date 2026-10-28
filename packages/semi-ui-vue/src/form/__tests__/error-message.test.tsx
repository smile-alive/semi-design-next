/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { FormErrorMessage, type FieldError } from '..';
import { errorSelector } from './fixtures/fields';

describe('Form-errorMessage', () => {
    it('class 与 style', () => {
        const { container } = render(FormErrorMessage, {
            props: { class: 'test', style: { color: 'red' }, error: 'semi error' },
        });
        const em = container.querySelector('.test');
        expect(em).not.toBeNull();
        expect(em).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('error：字符串', () => {
        const { container } = render(FormErrorMessage, { props: { error: 'semi error' } });
        expect(container.querySelector(`${errorSelector} span`)).toHaveTextContent(/^semi error$/);
    });

    it('error：字符串数组', () => {
        const { container } = render(FormErrorMessage, { props: { error: ['length error', 'size error'] } });
        expect(container.querySelector(`${errorSelector} span`)).toHaveTextContent(/^length error, size error$/);
    });

    it('#error 插槽自定义错误的渲染', () => {
        const { container } = render(FormErrorMessage, {
            props: { error: 'need-help', errorMessageId: 'em' },
            slots: {
                error: ({ error }: { error: FieldError }) => <div data-testid="node-error">{`go ${error}`}</div>,
            },
        });
        expect(container.querySelector(errorSelector)).toContainElement(screen.getByTestId('node-error'));
        expect(container.querySelector('#em')).toHaveTextContent('go need-help');
    });

    it('error：undefined', () => {
        const { container } = render(FormErrorMessage, { props: { error: undefined } });
        expect(container.querySelector(errorSelector)).toBeNull();
    });

    it('showValidateIcon 显示 validateStatus 对应的图标，helpText 使用帮助 id', async () => {
        const view = render(FormErrorMessage, {
            props: {
                error: 'bad',
                errorMessageId: 'em',
                helpTextId: 'ht',
                showValidateIcon: true,
                validateStatus: 'warning',
            },
            slots: { helpText: () => 'help' },
        });
        expect(view.container.querySelector('.semi-icon-alert_triangle')).not.toBeNull();
        expect(view.container.querySelector('#em')).toHaveTextContent('bad');
        await view.rerender({ error: undefined, validateStatus: undefined });
        expect(view.container.querySelector('#ht')).toHaveTextContent('help');
        expect(view.container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });

    it('其他属性透传到根 div', () => {
        const { container } = render(FormErrorMessage, { props: { error: 'bad' }, attrs: { 'data-testid': 'em' } });
        expect(container.querySelector(errorSelector)).toHaveAttribute('data-testid', 'em');
    });
});
