import { createRawSnippet, flushSync } from 'svelte';
import { screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import { renderAnyFields, renderGroup, renderWithField } from './b-helpers';
import { blur, getInput, input, labelSelector, prefix, renderForm, settle, typeInto } from './helpers';

const groupErrorSelector = `.${prefix}-field-group .${prefix}-field-error-message`;
const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

describe('Svelte Form 包装自定义控件', () => {
    it('使用方传入的 value、checked、fileList 不覆盖表单值，控件始终显示表单值', async () => {
        const { api } = renderAnyFields({}, [
            { type: 'input', props: { field: 'a', value: 'outside' } },
            { type: 'switch', props: { field: 'b', checked: true } },
            { type: 'checkbox', props: { field: 'c', checked: true } },
            { type: 'upload', props: { field: 'd', action: 'https://semi.design/upload', fileList: [{ uid: '1', name: 'init.txt', status: 'success', url: '' }] } },
        ]);
        await settle();
        expect(getInput()).toHaveValue('');
        expect(screen.getByRole('switch')).not.toBeChecked();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.queryByText('init.txt')).toBeNull();
        expect(api().getValues()).toEqual({});
        await typeInto(getInput(), 'typed');
        expect(api().getValue('a')).toBe('typed');
    });

    it('未声明 validateStatus、insetLabel 的组件收不到这两个属性，inset 回退为 top 并警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { api, container } = renderWithField({
            control: 'plain',
            form: {},
            fieldOptions: { validateStatus: false, insetLabel: false },
            fieldProps: { field: 'plain', id: 'plain', label: 'Plain', labelPosition: 'inset' },
        });
        api().setError('plain', 'bad');
        await settle();
        const control = container.querySelector('input') as HTMLInputElement;
        expect(control).not.toHaveAttribute('data-status');
        expect(control).not.toHaveAttribute('validatestatus');
        expect(control).not.toHaveAttribute('insetlabelid');
        expect(container.querySelector(`.${prefix}-field`)).toHaveAttribute('x-label-pos', 'top');
        expect(control).toHaveAttribute('aria-labelledby', 'plain-label');
        expect(document.getElementById('plain-label')).toHaveTextContent('Plain');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("laid out with labelPosition 'top'"));
        warn.mockRestore();
    });

    it('声明了 validateStatus 的组件收到字段的校验状态，id 与 aria-labelledby 指向标签，值经 onChange 写入', async () => {
        const { api, container } = renderWithField({ control: 'plain', form: {}, fieldProps: { field: 'custom', id: 'custom' } });
        const control = container.querySelector('input') as HTMLInputElement;
        await typeInto(control, 'semi');
        expect(api().getValue('custom')).toBe('semi');
        expect(control).toHaveValue('semi');
        expect(control).toHaveAttribute('id', 'custom');
        expect(control).toHaveAttribute('aria-labelledby', 'custom-label');
        api().setError('custom', 'bad');
        await settle();
        expect(control).toHaveAttribute('data-status', 'error');
    });

    it('children 与具名 snippet 原样转发给被包装组件，字段壳消费的 snippet 不转发', () => {
        const { container } = renderWithField({
            control: 'slotted',
            form: {},
            fieldProps: {
                field: 'slotted',
                children: text('body'),
                suffix: text('suffix'),
                fieldLabel: text('Field label'),
                labelExtra: text('extra'),
                helpText: text('help'),
                extraText: text('extra text'),
                error: text('error'),
            },
        });
        expect(container.querySelector('.slotted')).toHaveTextContent('body suffix');
        const received = (screen.getByTestId('received').textContent ?? '').split(',');
        for (const shell of ['fieldLabel', 'labelExtra', 'helpText', 'extraText', 'error', 'children', 'suffix']) {
            expect(received).not.toContain(shell);
        }
        expect(container.querySelector(`.${prefix}-field-label-text`)).toHaveTextContent('Field label');
    });

    it('使用方的 onBlur 与字段的 blur 处理都执行', async () => {
        const onBlur = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({}, [input('name', { onBlur })]);
        await blur(getInput());
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(api().getTouched('name')).toBe(true);
    });

    it('使用方的 aria-labelledby 在 label id 之前，aria-describedby 与 extraText 合并', () => {
        renderForm({}, [input('name', { id: 'name', label: 'Name', 'aria-labelledby': 'outer', 'aria-describedby': 'hint', extraText: text('extra') })]);
        const control = getInput();
        expect(control).toHaveAttribute('aria-labelledby', 'outer name-label');
        expect(control).toHaveAttribute('aria-describedby', 'hint name-extraText');
    });

    it('label 对象的 required 为 true 时控件带 aria-required，optional 为 true 时为 false', () => {
        const { container } = renderForm({}, [input('required', { label: { text: 'Required', required: true } }), input('optional', { label: { text: 'Optional', required: true, optional: true } })]);
        const [required, optional] = container.querySelectorAll('input');
        expect(required).toHaveAttribute('aria-required', 'true');
        expect(optional).toHaveAttribute('aria-required', 'false');
        expect(container.querySelectorAll(labelSelector)).toHaveLength(2);
    });
});

describe('Svelte Form FormInputGroup 子项增删', () => {
    it('子项增删时，组级错误跟随且没有告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        const { api, container, store } = renderGroup({
            form: {},
            group: { label: 'group' },
            fields: [{ props: { field: 'a', trigger: 'mount', validator: () => 'a-err' } }, { props: { field: 'b', trigger: 'mount', validator: () => 'b-err' }, shown: true }],
        });
        await settle();
        const groupError = () => container.querySelector(groupErrorSelector)?.textContent?.trim();
        expect(groupError()).toBe('a-err, b-err');
        store.fields[1].shown = false;
        await settle();
        expect(api().getFieldExist('b')).toBe(false);
        expect(groupError()).toBe('a-err');
        store.fields[1].shown = true;
        await settle();
        expect(groupError()).toBe('a-err, b-err');
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });
});

describe('Svelte Form initValues', () => {
    it('initValues 是响应式对象时拷贝其数据，之后修改源对象不影响表单', async () => {
        const { api, store } = renderForm({ initValues: { user: { name: 'semi' }, tags: ['a'] } }, [input('user.name'), input('tags[0]')]);
        expect(api().getValues()).toEqual({ user: { name: 'semi' }, tags: ['a'] });
        const source = store.form.initValues as { user: { name: string }; tags: string[] };
        source.user.name = 'changed';
        source.tags.push('b');
        flushSync();
        expect(document.querySelectorAll('input')[0]).toHaveValue('semi');
        api().setValue('user.name', 'typed');
        api().reset();
        await settle();
        expect(api().getValue('user')).toEqual({ name: 'semi' });
    });
});
