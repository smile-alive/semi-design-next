import { render, act } from '@testing-library/react';
import scrollIntoView, { type Options } from 'scroll-into-view-if-needed';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { Form } from '@fibrae/semi-ui-react';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

const fieldDOM = (field) => document.querySelector(`.semi-form-field[x-field-id="${field}"]`);

describe('Form 滚动', () => {
    beforeEach(() => vi.mocked(scrollIntoView).mockClear());

    it('autoScrollToError 使用默认选项滚动到第一个错误字段', async () => {
        let formApi;
        render(
            <Form autoScrollToError getFormApi={(api) => (formApi = api)}>
                <Form.Input field="a" />
                <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), { behavior: 'smooth', block: 'start' });
    });

    it('autoScrollToError 透传 options 对象', async () => {
        let formApi;
        const options: Options = { behavior: 'auto', block: 'center' };
        render(
            <Form autoScrollToError={options} getFormApi={(api) => (formApi = api)}>
                <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), options);
    });

    it('未设置 autoScrollToError 时不滚动', async () => {
        let formApi;
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('scrollToField 与 scrollToError 只在当前 Form 内查找字段', async () => {
        let formApi;
        render(
            <>
                <Form id="other">
                    <Form.Input field="b" />
                </Form>
                <Form getFormApi={(api) => (formApi = api)}>
                    <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
                </Form>
            </>
        );
        const target = document.querySelectorAll('.semi-form-field[x-field-id="b"]')[1];
        formApi.scrollToField('b', { block: 'end' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { block: 'end' });
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        formApi.scrollToError({ field: 'b' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { behavior: 'smooth', block: 'start' });
        formApi.scrollToError({ index: 0 });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { behavior: 'smooth', block: 'start' });
    });

    it('栅格布局下滚动到字段根节点，而不是内容列', async () => {
        let formApi;
        render(
            <Form autoScrollToError getFormApi={(api) => (formApi = api)} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Form.Input field="b" rules={[{ required: true, message: 'required' }]} />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), { behavior: 'smooth', block: 'start' });
        formApi.scrollToError({ field: 'b' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(fieldDOM('b'), { behavior: 'smooth', block: 'start' });
    });

    it('表单级 validator 失败后，错误渲染完成即滚动，不等定时器', async () => {
        let formApi;
        render(
            <Form autoScrollToError getFormApi={(api) => (formApi = api)} validator={() => ({ b: 'form error' })}>
                <Form.Input field="b" />
            </Form>
        );
        await act(() => expect(formApi.validate()).rejects.toEqual({ b: 'form error' }));
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), { behavior: 'smooth', block: 'start' });
    });

    it('字段名含引号时 scrollToField 与 scrollToError 正常查找', async () => {
        let formApi;
        const field = 'a["b"]';
        render(
            <Form getFormApi={(api) => (formApi = api)}>
                <Form.Input field={field} rules={[{ required: true, message: 'required' }]} />
            </Form>
        );
        const target = document.querySelector('.semi-form-field');
        formApi.scrollToField(field);
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { behavior: 'smooth', block: 'start' });
        await act(() => expect(formApi.validate()).rejects.toBeDefined());
        formApi.scrollToError({ field });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { behavior: 'smooth', block: 'start' });
    });
});
