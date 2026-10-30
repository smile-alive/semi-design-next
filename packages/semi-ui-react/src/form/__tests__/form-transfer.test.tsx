import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

const dataSource = [
    { label: 'Alice', value: 'a', key: 'a' },
    { label: 'Bob', value: 'b', key: 'b' },
    { label: 'Carol', value: 'c', key: 'c' },
];

const selectedTexts = () => Array.from(document.querySelectorAll(`.${BASE_CLASS_PREFIX}-transfer-right-item-text`)).map((item) => item.textContent);
const pick = (name: string) => userEvent.click(within(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).getByText(name));

function renderTransfer(fieldProps: Record<string, unknown> = {}, formProps: Record<string, unknown> = {}) {
    let api: FormApi;
    render(
        <Form getFormApi={(formApi) => (api = formApi)} {...formProps}>
            <Form.Transfer dataSource={dataSource} field="members" label="Members" {...fieldProps} />
        </Form>
    );
    return { api: () => api };
}

describe('Form.Transfer', () => {
    it('显示 initValue 对应的已选项，并以 label 命名', () => {
        renderTransfer({ initValue: ['b'] });
        expect(selectedTexts()).toEqual(['Bob']);
        expect(screen.getByRole('group', { name: 'Members' })).toBeInTheDocument();
    });

    it('选择后 formApi 取值更新，onChange 末参是最新表单值', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderTransfer({ onChange });
        await pick('Alice');
        await pick('Carol');
        expect(api().getValue('members')).toEqual(['a', 'c']);
        expect(selectedTexts()).toEqual(['Alice', 'Carol']);
        expect(onChange.mock.lastCall?.at(-1)).toEqual({ members: ['a', 'c'] });
    });

    it('setValue 同步到已选列表，reset 回到 initValue', async () => {
        const { api } = renderTransfer({ initValue: ['a'] });
        await pick('Bob');
        expect(selectedTexts()).toEqual(['Alice', 'Bob']);
        api().setValue('members', ['c']);
        await waitFor(() => expect(selectedTexts()).toEqual(['Carol']));
        api().reset();
        await waitFor(() => expect(selectedTexts()).toEqual(['Alice']));
        expect(api().getValue('members')).toEqual(['a']);
    });

    it('没有 initValue 时 reset 回到空', async () => {
        const { api } = renderTransfer();
        await pick('Alice');
        api().reset();
        await waitFor(() => expect(selectedTexts()).toEqual([]));
        expect(api().getValue('members')).toBeUndefined();
    });

    it('校验失败时显示错误信息，选择后（trigger 为 change）错误消失', async () => {
        const { api } = renderTransfer({ rules: [{ required: true, type: 'array', message: '请选择成员' }] });
        await api()
            .validate()
            .catch(() => undefined);
        expect(await screen.findByText('请选择成员')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Members' })).toHaveAttribute('aria-invalid', 'true');
        await pick('Alice');
        await waitFor(() => expect(screen.queryByText('请选择成员')).toBeNull());
    });

    it('Form 的 disabled 传给 Transfer', () => {
        renderTransfer({ initValue: ['a'] }, { disabled: true });
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-transfer`)).toHaveClass(`${BASE_CLASS_PREFIX}-transfer-disabled`);
    });

    it('Form 注入的状态属性不落到 Transfer 的 DOM 上，inset 布局回落到 top', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        renderTransfer({ validateStatus: 'error' }, { labelPosition: 'inset' });
        const attributes = [...document.querySelectorAll('*')].flatMap((element) => element.getAttributeNames());
        expect(attributes.filter((key) => /^(validate-?status|inset-?label-?id)$/i.test(key))).toEqual([]);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-form-field`)).toHaveAttribute('x-label-pos', 'top');
        warn.mockRestore();
    });
});
