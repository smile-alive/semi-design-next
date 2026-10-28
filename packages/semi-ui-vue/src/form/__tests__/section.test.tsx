/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { Form, FormSection } from '..';
import { FormInput } from './fixtures/fields';

const textSelector = `.${BASE_CLASS_PREFIX}-form-section-text`;

describe('Form.Section', () => {
    it('class 与 style', () => {
        const { container } = render(FormSection, { props: { class: 'sec-test', style: { color: 'red' } } });
        const section = container.querySelector('section.sec-test');
        expect(section).not.toBeNull();
        expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('默认插槽', () => {
        const { container } = render(() => <Form>{() => <FormSection>{() => <FormInput class="test" field="test" />}</FormSection>}</Form>);
        expect(container.querySelector('section .test')).not.toBeNull();
    });

    it('#text 插槽', () => {
        const view = render(FormSection, { slots: { text: () => 'semi' } });
        expect(view.container.querySelector(textSelector)).toHaveTextContent(/^semi$/);
        view.unmount();
        render(FormSection, { slots: { text: () => <div data-testid="node-text">semi</div> } });
        expect(document.querySelector(textSelector)).toContainElement(screen.getByTestId('node-text'));
    });

    it('其他属性透传到 section 元素', () => {
        const { container } = render(FormSection, { attrs: { 'data-testid': 'sec' } });
        expect(container.querySelector('section')).toHaveAttribute('data-testid', 'sec');
    });

    it('没有 #text 时不渲染空的 h5 标题', () => {
        const { container } = render(FormSection, { slots: { default: () => 'content' } });
        expect(container.querySelector('h5')).toBeNull();
        expect(container.querySelector('section')).toHaveTextContent('content');
    });
});
