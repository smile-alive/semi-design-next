import { createRawSnippet } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import FormSection from '../section.svelte';
import { prefix } from './helpers';

const textSelector = `.${prefix}-section-text`;
const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));

describe('FormSection', () => {
    it('class 与 style', () => {
        const { container } = render(FormSection, { props: { class: 'sec-test', style: 'color: red' } });
        const section = container.querySelector('fieldset.sec-test');
        expect(section).not.toBeNull();
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('默认内容渲染在 fieldset 内', () => {
        const { container } = render(FormSection, { props: { children: html('<div class="test"></div>') } });
        expect(container.querySelector('fieldset .test')).not.toBeNull();
    });

    it('text snippet 渲染在 legend 里并命名分组', () => {
        const view = render(FormSection, { props: { text: html('<span>semi</span>') } });
        expect(view.container.querySelector(textSelector)).toHaveTextContent('semi');
        expect(screen.getByRole('group', { name: 'semi' })).toBe(view.container.querySelector('fieldset'));
        view.unmount();
        render(FormSection, { props: { text: html('<div data-testid="node-text">semi</div>') } });
        expect(document.querySelector(textSelector)).toContainElement(document.querySelector('[data-testid="node-text"]'));
    });

    it('其他属性透传到 fieldset 元素', () => {
        const { container } = render(FormSection, { props: { 'data-testid': 'sec' } });
        expect(container.querySelector('fieldset')).toHaveAttribute('data-testid', 'sec');
    });

    it('没有 text 时不渲染空的 legend', () => {
        const { container } = render(FormSection, { props: { children: html('<span>content</span>') } });
        expect(container.querySelector('legend')).toBeNull();
        expect(container.querySelector('fieldset')).toHaveTextContent('content');
    });
});
