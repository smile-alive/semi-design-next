/** @jsxImportSource vue */
import { nextTick } from 'vue';
import scrollIntoView, { type Options } from 'scroll-into-view-if-needed';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, type FormApi } from '..';
import { flush, FormInput, renderForm } from './fixtures/fields';

vi.mock('scroll-into-view-if-needed', () => ({ default: vi.fn<() => void>() }));

const fieldDOM = (field: string) => document.querySelector(`.semi-form-field[x-field-id="${field}"]`);
const required = [{ required: true, message: 'required' }];
const smooth = { behavior: 'smooth', block: 'start' };

describe('Form 滚动', () => {
    beforeEach(() => vi.mocked(scrollIntoView).mockClear());

    it('autoScrollToError 使用默认选项滚动到第一个错误字段', async () => {
        const { api } = renderForm({ autoScrollToError: true }, () => (
            <>
                <FormInput field="a" />
                <FormInput field="b" rules={required} />
            </>
        ));
        await expect(api().validate()).rejects.toBeDefined();
        await flush();
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), smooth);
    });

    it('autoScrollToError 透传 options 对象', async () => {
        const options: Options = { behavior: 'auto', block: 'center' };
        const { api } = renderForm({ autoScrollToError: options }, () => <FormInput field="b" rules={required} />);
        await expect(api().validate()).rejects.toBeDefined();
        await flush();
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), options);
    });

    it('未设置 autoScrollToError 时不滚动', async () => {
        const { api } = renderForm({}, () => <FormInput field="b" rules={required} />);
        await expect(api().validate()).rejects.toBeDefined();
        await flush();
        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('scrollToField 与 scrollToError 只在当前 Form 内查找字段', async () => {
        let formApi: FormApi | undefined;
        render(() => (
            <>
                <Form id="other">{() => <FormInput field="b" />}</Form>
                <Form onGetFormApi={(api: FormApi) => (formApi = api)}>{() => <FormInput field="b" rules={required} />}</Form>
            </>
        ));
        const api = formApi as FormApi;
        const target = document.querySelectorAll('.semi-form-field[x-field-id="b"]')[1];
        api.scrollToField('b', { block: 'end' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, { block: 'end' });
        await expect(api.validate()).rejects.toBeDefined();
        await flush();
        api.scrollToError({ field: 'b' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, smooth);
        api.scrollToError({ index: 0 });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, smooth);
    });

    it('栅格布局下滚动到字段根节点，而不是内容列', async () => {
        const { api } = renderForm({ autoScrollToError: true, labelCol: { span: 6 }, wrapperCol: { span: 18 } }, () => <FormInput field="b" rules={required} />);
        await expect(api().validate()).rejects.toBeDefined();
        await flush();
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), smooth);
        api().scrollToError({ field: 'b' });
        expect(scrollIntoView).toHaveBeenLastCalledWith(fieldDOM('b'), smooth);
    });

    it('表单级 validator 失败后，错误渲染完成即滚动，不等定时器', async () => {
        const { api } = renderForm({ autoScrollToError: true, validator: () => ({ b: 'form error' }) }, () => <FormInput field="b" />);
        await expect(api().validate()).rejects.toEqual({ b: 'form error' });
        await nextTick();
        expect(scrollIntoView).toHaveBeenCalledWith(fieldDOM('b'), smooth);
    });

    it('字段名含引号时 scrollToField 与 scrollToError 正常查找', async () => {
        const field = 'a["b"]';
        const { api } = renderForm({}, () => <FormInput field={field} rules={required} />);
        const target = document.querySelector('.semi-form-field');
        api().scrollToField(field);
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, smooth);
        await expect(api().validate()).rejects.toBeDefined();
        await flush();
        api().scrollToError({ field });
        expect(scrollIntoView).toHaveBeenLastCalledWith(target, smooth);
    });
});
