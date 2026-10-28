import { type JSX } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { type FormApi, type FormProps, Form, FormInput } from '..';

// Real scrolling instead of a mocked scroll-into-view-if-needed: semi-ui-solid does not depend on that package
const toTop = { behavior: 'auto', block: 'start' } as const;
const required = [{ required: true, message: 'required' }];
const spacer = () => <div style={{ height: '300vh' }} />;

const fieldDOM = (field: string, index = 0) => document.querySelectorAll(`.semi-form-field[x-field-id="${field}"]`)[index] as HTMLElement;
const topOf = (element: Element) => element.getBoundingClientRect().top;

function renderForm(props: FormProps, children: () => JSX.Element) {
    let formApi: FormApi | undefined;
    render(() => (
        <Form getFormApi={(api) => (formApi = api)} {...props}>
            {children()}
        </Form>
    ));
    return () => formApi as FormApi;
}

describe('Form 滚动', () => {
    afterEach(() => window.scrollTo(0, 0));

    it('autoScrollToError 默认平滑滚动到第一个错误字段的顶部', async () => {
        const api = renderForm({ autoScrollToError: true }, () => (
            <>
                <FormInput field="a" />
                {spacer()}
                <FormInput field="b" rules={required} />
                {spacer()}
                <FormInput field="c" rules={required} />
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        await expect.poll(() => Math.abs(topOf(fieldDOM('b')))).toBeLessThan(2);
    });

    it('autoScrollToError 透传 options 对象', async () => {
        const api = renderForm({ autoScrollToError: { behavior: 'auto', block: 'center' } }, () => (
            <>
                {spacer()}
                <FormInput field="b" rules={required} />
                {spacer()}
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        const rect = fieldDOM('b').getBoundingClientRect();
        expect(Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2)).toBeLessThan(2);
    });

    it('未设置 autoScrollToError 时不滚动', async () => {
        const api = renderForm({}, () => (
            <>
                {spacer()}
                <FormInput field="b" rules={required} />
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        await new Promise(requestAnimationFrame);
        expect(window.scrollY).toBe(0);
    });

    it('scrollToField 与 scrollToError 只在当前 Form 内查找字段', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <>
                <Form id="other">
                    {spacer()}
                    <FormInput field="b" />
                </Form>
                <Form getFormApi={(api) => (formApi = api)}>
                    {spacer()}
                    <FormInput field="b" rules={required} />
                    {spacer()}
                </Form>
            </>
        ));
        const target = fieldDOM('b', 1);
        formApi?.scrollToField('b', toTop);
        expect(Math.abs(topOf(target))).toBeLessThan(2);
        window.scrollTo(0, 0);
        await expect(formApi?.validate()).rejects.toBeDefined();
        formApi?.scrollToError({ field: 'b', scrollOpts: toTop });
        expect(Math.abs(topOf(target))).toBeLessThan(2);
        window.scrollTo(0, 0);
        formApi?.scrollToError({ index: 0, scrollOpts: toTop });
        expect(Math.abs(topOf(target))).toBeLessThan(2);
    });

    it('栅格布局下滚动到字段根节点，而不是内容列', async () => {
        const api = renderForm({ labelCol: { span: 6 }, wrapperCol: { span: 18 } }, () => (
            <>
                {spacer()}
                <FormInput field="b" label="B" rules={required} />
                {spacer()}
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        api().scrollToError({ field: 'b', scrollOpts: toTop });
        expect(Math.abs(topOf(fieldDOM('b')))).toBeLessThan(2);
    });

    it('表单级 validator 失败后，错误渲染完成即滚动', async () => {
        const api = renderForm({ autoScrollToError: toTop, validator: () => ({ b: 'form error' }) }, () => (
            <>
                {spacer()}
                <FormInput field="b" />
                {spacer()}
            </>
        ));
        await expect(api().validate()).rejects.toEqual({ b: 'form error' });
        await expect.poll(() => Math.abs(topOf(fieldDOM('b')))).toBeLessThan(2);
    });

    it('字段名含引号时 scrollToField 与 scrollToError 正常查找', async () => {
        const field = 'a["b"]';
        const api = renderForm({}, () => (
            <>
                {spacer()}
                <FormInput field={field} rules={required} />
                {spacer()}
            </>
        ));
        const target = document.querySelector('.semi-form-field') as HTMLElement;
        api().scrollToField(field, toTop);
        expect(Math.abs(topOf(target))).toBeLessThan(2);
        window.scrollTo(0, 0);
        await expect(api().validate()).rejects.toBeDefined();
        api().scrollToError({ field, scrollOpts: toTop });
        expect(Math.abs(topOf(target))).toBeLessThan(2);
    });
});
