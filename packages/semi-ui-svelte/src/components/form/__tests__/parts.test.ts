import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import FormLabel from '../label.svelte';
import FormSection from '../section.svelte';
import { input, prefix, renderForm } from './helpers';

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

describe('Svelte Form 部位', () => {
    it('classNames 与 styles 按部位落到对应元素', () => {
        const parts = ['label', 'labelText', 'labelExtra', 'labelTooltip', 'content', 'help', 'extra'] as const;
        const selectors = { label: 'field-label', labelText: 'field-label-text', labelExtra: 'field-label-extra', labelTooltip: 'field-label-tooltip', content: 'field-main', help: 'field-help-text', extra: 'field-extra' };
        const { container } = renderForm(
            {
                classNames: Object.fromEntries(parts.map((p) => [p, `my-${p}`])),
                styles: Object.fromEntries(parts.map((p) => [p, `order: ${parts.indexOf(p) + 1}`])),
            },
            [input('a', { label: { text: 'a', tooltip: 't' }, labelExtra: text('e'), helpText: text('h'), extraText: text('x') })]
        );
        for (const part of parts) {
            const el = container.querySelector(`.${prefix}-${selectors[part]}`);
            expect(el).toHaveClass(`my-${part}`);
            expect(el).toHaveStyle({ order: String(parts.indexOf(part) + 1) });
        }
    });
});

describe('Svelte Form.Section 部位', () => {
    it('classNames 与 styles 按部位落到对应元素', () => {
        const { container } = render(FormSection, { props: { text: text('t'), extraText: text('e'), classNames: { title: 'my-title', extra: 'my-extra' }, styles: { title: 'order: 1', extra: 'order: 2' } } });
        expect(container.querySelector(`.${prefix}-section-text`)).toHaveClass('my-title');
        expect(container.querySelector(`.${prefix}-section-text`)).toHaveStyle({ order: '1' });
        expect(container.querySelector(`.${prefix}-section-extra`)).toHaveClass('my-extra');
        expect(container.querySelector(`.${prefix}-section-extra`)).toHaveStyle({ order: '2' });
    });
});

describe('Svelte Form.Label 部位', () => {
    it('classNames 与 styles 按部位落到对应元素', () => {
        const { container } = render(FormLabel, {
            props: { text: 't', extra: text('e'), tooltip: 'tip', classNames: { text: 'my-text', extra: 'my-extra', tooltip: 'my-tooltip' }, styles: { text: 'order: 1', extra: 'order: 2', tooltip: 'order: 3' } },
        });
        expect(container.querySelector(`.${prefix}-field-label-text`)).toHaveClass('my-text');
        expect(container.querySelector(`.${prefix}-field-label-text`)).toHaveStyle({ order: '1' });
        expect(container.querySelector(`.${prefix}-field-label-extra`)).toHaveClass('my-extra');
        expect(container.querySelector(`.${prefix}-field-label-extra`)).toHaveStyle({ order: '2' });
        expect(container.querySelector(`.${prefix}-field-label-tooltip`)).toHaveClass('my-tooltip');
        expect(container.querySelector(`.${prefix}-field-label-tooltip`)).toHaveStyle({ order: '3' });
    });

    it('Form 的 label* 键作用到标签，Label 自己的 classNames 在后', () => {
        const { container } = renderForm({ classNames: { labelText: 'form-text' }, styles: { labelText: 'order: 1; color: red' } }, [input('a', { label: { text: 'a', classNames: { text: 'own-text' }, styles: { text: 'color: blue' } } })]);
        const el = container.querySelector(`.${prefix}-field-label-text`);
        expect(el!.className).toMatch(new RegExp(`${prefix}-field-label-text form-text own-text$`));
        expect(el).toHaveStyle({ order: '1', color: 'rgb(0, 0, 255)' });
    });
});
