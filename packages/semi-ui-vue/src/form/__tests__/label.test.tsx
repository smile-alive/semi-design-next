/** @jsxImportSource vue */
import { type ComponentPublicInstance } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import LocaleProvider from '../../locale/locale-provider.vue';
import Label from '../label.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-form-field-label`;
const getLabel = () => document.querySelector('label') as HTMLLabelElement;

describe('Form Label', () => {
    it('class 与 style', () => {
        render(Label, { attrs: { class: 'label-test', style: { color: 'red' } } });
        expect(getLabel()).toHaveClass('label-test', prefixCls);
        expect(getLabel()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('required 必填', () => {
        render(Label, { props: { required: true } });
        expect(getLabel()).toHaveClass(`${prefixCls}-required`);
    });

    it('required 与 optional 同时为真时不加必填类名', () => {
        render(Label, { props: { required: true, optional: true } });
        expect(getLabel()).not.toHaveClass(`${prefixCls}-required`);
    });

    it('text：字符串、数字 0 与默认插槽', async () => {
        const view = render(Label, { props: { text: 'semi' } });
        expect(getLabel()).toHaveTextContent(/^semi$/);
        await view.rerender({ text: 0 });
        expect(getLabel()).toHaveTextContent(/^0$/);
        view.unmount();
        render(Label, { slots: { default: () => <div data-testid="node-text">semi</div> } });
        expect(screen.getByTestId('node-text')).toHaveTextContent('semi');
    });

    it('默认插槽优先于 text，#extra 插槽优先于 extra', () => {
        render(Label, {
            props: { text: 'prop', extra: 'prop extra' },
            slots: { default: () => 'slot', extra: () => 'slot extra' },
        });
        expect(document.querySelector(`.${prefixCls}-text`)).toHaveTextContent(/^slot$/);
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent(/^slot extra$/);
        expect(getLabel()).toHaveClass(`${prefixCls}-with-extra`);
    });

    it('extra 属性渲染额外区域，空字符串不渲染', async () => {
        const view = render(Label, { props: { text: 'name', extra: 'hint' } });
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('hint');
        await view.rerender({ extra: '' });
        expect(document.querySelector(`.${prefixCls}-extra`)).toBeNull();
        expect(getLabel()).not.toHaveClass(`${prefixCls}-with-extra`);
    });

    it('text-align', () => {
        render(Label, { props: { align: 'right' } });
        expect(getLabel()).toHaveClass(`${prefixCls}-right`);
    });

    it('width：数字加 px，字符串原样', async () => {
        const view = render(Label, { props: { width: 200 } });
        expect(getLabel()).toHaveStyle({ width: '200px' });
        await view.rerender({ width: '50%' });
        expect(getLabel().style.width).toBe('50%');
    });

    it('未声明属性落到 label 元素，$el 是 label', () => {
        let instance: ComponentPublicInstance | null = null;
        const Host = () => (
            <Label
                data-testid="label"
                style={{ color: 'red' }}
                width={100}
                ref={(value) => {
                    instance = value as ComponentPublicInstance | null;
                }}
            />
        );
        render(Host);
        expect(screen.getByTestId('label')).toBe(getLabel());
        expect(getLabel()).toHaveStyle({ width: '100px', color: 'rgb(255, 0, 0)' });
        expect((instance as ComponentPublicInstance | null)?.$el).toBe(getLabel());
    });

    it('name 作为 for，无 name 时没有 for 属性', async () => {
        const view = render(Label, { props: { text: 'name' } });
        expect(getLabel()).not.toHaveAttribute('for');
        await view.rerender({ name: 'field' });
        expect(getLabel()).toHaveAttribute('for', 'field');
    });

    it('optional 追加语言包文案', () => {
        const view = render(Label, { props: { optional: true, text: 'name' } });
        expect(document.querySelector(`.${prefixCls}-optional-text`)).toHaveTextContent(zh_CN.Form.optional);
        view.unmount();
        render(LocaleProvider, {
            props: { locale: ja_JP },
            slots: { default: () => <Label optional text="name" /> },
        });
        expect(document.querySelector(`.${prefixCls}-optional-text`)).toHaveTextContent(ja_JP.Form.optional);
    });

    it('disabled', () => {
        render(Label, { props: { disabled: true } });
        expect(getLabel()).toHaveClass(`${prefixCls}-disabled`);
    });
});
