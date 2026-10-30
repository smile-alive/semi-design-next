import { createRawSnippet } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Label from '../label.svelte';
import ALabelLocale from './a-label-locale.svelte';
import { labelSelector, prefix } from './helpers';

const prefixCls = `${prefix}-field-label`;
const getLabel = () => document.querySelector(labelSelector) as HTMLLabelElement;
const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));

describe('FormLabel', () => {
    it('class 与 style', () => {
        render(Label, { props: { class: 'label-test', style: 'color: red' } });
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

    it('text：字符串、数字 0 与 children snippet', () => {
        const view = render(Label, { props: { text: 'semi' } });
        expect(getLabel()).toHaveTextContent('semi');
        view.unmount();
        const zero = render(Label, { props: { text: 0 } });
        expect(getLabel()).toHaveTextContent('0');
        zero.unmount();
        render(Label, { props: { children: html('<div data-testid="node-text">semi</div>') } });
        expect(screen.getByTestId('node-text')).toHaveTextContent('semi');
    });

    it('children snippet 优先于 text，extra snippet 渲染额外区域并加 with-extra 类', () => {
        render(Label, { props: { text: 'prop', children: html('<span>slot</span>'), extra: html('<span>slot extra</span>') } });
        expect(document.querySelector(`.${prefixCls}-text`)).toHaveTextContent('slot');
        expect(document.querySelector(`.${prefixCls}-extra`)).toHaveTextContent('slot extra');
        expect(getLabel()).toHaveClass(`${prefixCls}-with-extra`);
    });

    it('没有 extra 时不渲染额外区域', () => {
        render(Label, { props: { text: 'name' } });
        expect(document.querySelector(`.${prefixCls}-extra`)).toBeNull();
        expect(getLabel()).not.toHaveClass(`${prefixCls}-with-extra`);
    });

    it('text-align', () => {
        render(Label, { props: { align: 'right' } });
        expect(getLabel()).toHaveClass(`${prefixCls}-right`);
    });

    it('width：数字加 px，字符串原样', () => {
        const view = render(Label, { props: { width: 200 } });
        expect(getLabel()).toHaveStyle({ width: '200px' });
        view.unmount();
        render(Label, { props: { width: '50%' } });
        expect(getLabel().style.width).toBe('50%');
    });

    it('未声明属性落到 label 元素，并与 width 合并', () => {
        render(Label, { props: { 'data-testid': 'label', style: 'color: red', width: 100 } });
        expect(screen.getByTestId('label')).toBe(getLabel());
        expect(getLabel()).toHaveStyle({ width: '100px', color: 'rgb(255, 0, 0)' });
    });

    it('name 作为 for，无 name 时没有 for 属性', () => {
        const view = render(Label, { props: { text: 'name' } });
        expect(getLabel()).not.toHaveAttribute('for');
        view.unmount();
        render(Label, { props: { text: 'name', name: 'field' } });
        expect(getLabel()).toHaveAttribute('for', 'field');
    });

    it('optional 追加语言包文案', () => {
        const view = render(Label, { props: { optional: true, text: 'name' } });
        expect(document.querySelector(`.${prefixCls}-optional-text`)).toHaveTextContent(zh_CN.Form.optional);
        view.unmount();
        render(ALabelLocale);
        expect(document.querySelector(`.${prefixCls}-optional-text`)).toHaveTextContent(ja_JP.Form.optional);
    });

    it('disabled', () => {
        render(Label, { props: { disabled: true } });
        expect(getLabel()).toHaveClass(`${prefixCls}-disabled`);
    });
});
