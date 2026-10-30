import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import FormErrorMessage from '../error-message.svelte';
import { errorSelector } from './helpers';

describe('FormErrorMessage', () => {
    it('class 与 style', () => {
        const { container } = render(FormErrorMessage, { props: { class: 'test', style: 'color: red', error: 'semi error' } });
        const em = container.querySelector('.test');
        expect(em).not.toBeNull();
        expect(em).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('error：字符串', () => {
        const { container } = render(FormErrorMessage, { props: { error: 'semi error' } });
        expect(container.querySelector(`${errorSelector} span`)).toHaveTextContent('semi error');
    });

    it('error：字符串数组', () => {
        const { container } = render(FormErrorMessage, { props: { error: ['length error', 'size error'] } });
        expect(container.querySelector(`${errorSelector} span`)).toHaveTextContent('length error, size error');
    });

    it('errorContent snippet 自定义错误的渲染', () => {
        const errorContent = createRawSnippet<[{ error: unknown }]>((arg) => ({
            render: () => `<div data-testid="node-error">go ${String(arg().error)}</div>`,
        }));
        const { container } = render(FormErrorMessage, { props: { error: 'need-help', errorMessageId: 'em', errorContent } });
        expect(container.querySelector(errorSelector)).toContainElement(container.querySelector('[data-testid="node-error"]'));
        expect(container.querySelector('#em')).toHaveTextContent('go need-help');
    });

    it('error：undefined', () => {
        const { container } = render(FormErrorMessage, { props: { error: undefined } });
        expect(container.querySelector(errorSelector)).toBeNull();
    });

    it('showValidateIcon 显示 validateStatus 对应的图标', () => {
        const { container } = render(FormErrorMessage, { props: { error: 'bad', errorMessageId: 'em', showValidateIcon: true, validateStatus: 'warning' } });
        expect(container.querySelector('.semi-icon-alert_triangle')).not.toBeNull();
        expect(container.querySelector('#em')).toHaveTextContent('bad');
    });

    it('没有 error 时渲染 helpText 并使用帮助 id，不显示校验图标', () => {
        const helpText = createRawSnippet(() => ({ render: () => '<span>help</span>' }));
        const { container } = render(FormErrorMessage, { props: { error: undefined, helpTextId: 'ht', showValidateIcon: true, helpText } });
        expect(container.querySelector('#ht')).toHaveTextContent('help');
        expect(container.querySelector('.semi-form-field-validate-status-icon')).toBeNull();
    });

    it('其他属性透传到根 div', () => {
        const { container } = render(FormErrorMessage, { props: { error: 'bad', 'data-testid': 'em' } });
        expect(container.querySelector(errorSelector)).toHaveAttribute('data-testid', 'em');
    });
});
