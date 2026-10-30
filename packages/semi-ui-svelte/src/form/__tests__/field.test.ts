import { createRawSnippet, flushSync } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vite-plus/test';
import FormInput from '../form-input.svelte';
import { blur, errorSelector, fieldSelector, getInput, input, labelSelector, prefix, renderForm, settle, typeInto } from './helpers';

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

describe('Svelte Form 字段', () => {
    it('fieldClassName、fieldStyle 落在字段外层，class 落在控件上', () => {
        const { container } = renderForm({}, [input('name', { fieldClassName: 'f-cls', fieldStyle: 'color: red', class: 'ctl' })]);
        const field = container.querySelector(fieldSelector) as HTMLElement;
        expect(field).toHaveClass('f-cls');
        expect(field).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(field).toHaveAttribute('x-field-id', 'name');
        expect(container.querySelector('.semi-input-wrapper.ctl')).not.toBeNull();
    });

    it('label 默认取 field，可传字符串或配置对象；label 的 for 与控件 id、aria-labelledby 互相对应', () => {
        const { container } = renderForm({}, [input('name'), input('age', { label: { text: '年龄', required: true, extra: undefined } }), input('nick', { label: '昵称' })]);
        const labels = container.querySelectorAll(labelSelector);
        expect(labels[0]).toHaveTextContent('name');
        expect(labels[1]).toHaveTextContent('年龄');
        expect(labels[1]).toHaveClass(`${prefix}-field-label-required`);
        expect(labels[2]).toHaveTextContent('昵称');
        const control = screen.getByRole('textbox', { name: '昵称' });
        expect(labels[2].getAttribute('for')).toBe(control.id);
        expect(control.getAttribute('aria-labelledby')).toBe(labels[2].id);
        expect(screen.getByRole('textbox', { name: '年龄' })).toHaveAttribute('aria-required', 'true');
    });

    it('fieldLabel 与 labelExtra snippet 替换标签内容', () => {
        renderForm({}, [input('name', { fieldLabel: text('自定义'), labelExtra: text('提示') })]);
        expect(screen.getByRole('textbox', { name: '自定义 提示' })).not.toBeNull();
        expect(document.querySelector(`.${prefix}-field-label-extra`)).toHaveTextContent('提示');
    });

    it('noLabel 不渲染标签，控件不引用不存在的 id', () => {
        const { container } = renderForm({}, [input('name', { noLabel: true })]);
        expect(container.querySelector(labelSelector)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-labelledby');
    });

    it('两个 Form 有同名字段时控件 id 不重复，显式 id 优先', () => {
        renderForm({}, [input('name')]);
        renderForm({}, [input('name', { id: 'given' })]);
        const inputs = document.querySelectorAll('input');
        expect(inputs[0].id).not.toBe(inputs[1].id);
        expect(inputs[1].id).toBe('given');
        expect(document.querySelectorAll(labelSelector)[1].getAttribute('for')).toBe('given');
    });

    it('labelPosition="inset" 时标签进入控件，不渲染外部标签；带 prefix 时回退为 top', () => {
        const { container } = renderForm({}, [input('name', { labelPosition: 'inset', label: '姓名' }), input('age', { labelPosition: 'inset', label: '年龄', prefix: text('P') })]);
        const fields = container.querySelectorAll(fieldSelector);
        expect(fields[0].querySelector(labelSelector)).toBeNull();
        expect(screen.getByRole('textbox', { name: '姓名' })).not.toBeNull();
        expect(fields[1]).toHaveAttribute('x-label-pos', 'top');
        expect(fields[1].querySelector(labelSelector)).toHaveTextContent('年龄');
    });

    it('initValue 作为初值，优先于 Form 的 initValues', () => {
        renderForm({ initValues: { a: 'form', b: 'form' } }, [input('a', { initValue: 'field' }), input('b')]);
        const inputs = document.querySelectorAll('input');
        expect(inputs[0]).toHaveValue('field');
        expect(inputs[1]).toHaveValue('form');
    });

    it('字段 onChange 在控件参数后追加最新的表单值', async () => {
        const onChange = vi.fn<(...args: unknown[]) => void>();
        renderForm({}, [input('name', { onChange })]);
        await typeInto(getInput(), 'semi');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe('semi');
        expect(onChange.mock.calls[0].at(-1)).toEqual({ name: 'semi' });
    });

    it('同步 validator 失败时显示错误，控件带 aria-invalid 与指向错误文字的 aria-errormessage', async () => {
        const { container } = renderForm({}, [input('name', { validator: (value: string) => (value === 'bad' ? '不合法' : '') })]);
        await typeInto(getInput(), 'bad');
        await settle();
        const error = container.querySelector(errorSelector) as HTMLElement;
        expect(error).toHaveTextContent('不合法');
        const control = getInput();
        expect(control).toHaveAttribute('aria-invalid', 'true');
        const message = document.getElementById(control.getAttribute('aria-errormessage') ?? '');
        expect(message).toHaveTextContent('不合法');
        expect(container.querySelector('.semi-input-wrapper-error')).not.toBeNull();
        await typeInto(getInput(), 'good');
        await settle();
        expect(container.querySelector(errorSelector)).toBeNull();
        expect(getInput()).not.toHaveAttribute('aria-invalid');
        expect(getInput()).not.toHaveAttribute('aria-errormessage');
    });

    it('异步 validator 的结果在 settle 后显示', async () => {
        const { container } = renderForm({}, [input('name', { validator: async (value: string) => (value.length < 3 ? '太短' : '') })]);
        await typeInto(getInput(), 'ab');
        await settle();
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('太短');
    });

    it('rules 校验，stopValidateWithError 在第一条失败处停止', async () => {
        const rules = [
            { required: true, message: '必填' },
            { type: 'string', min: 5, message: '至少 5 位' },
        ];
        const { api, container } = renderForm({}, [input('a', { rules }), input('b', { rules, stopValidateWithError: true })]);
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        const errors = container.querySelectorAll(errorSelector);
        expect(errors[0]).toHaveTextContent('必填');
        expect(errors[1]).toHaveTextContent('必填');
        await typeInto(container.querySelectorAll('input')[0], 'ab');
        await typeInto(container.querySelectorAll('input')[1], 'ab');
        await settle();
        expect(api().getError('a')).toBe('至少 5 位');
        expect(api().getError('b')).toBe('至少 5 位');
    });

    it('trigger="blur" 时变化不校验，失焦后校验并标记 touched', async () => {
        const { container, api } = renderForm({}, [input('name', { trigger: 'blur', rules: [{ required: true, message: '必填' }] })]);
        await typeInto(getInput(), '');
        await settle();
        expect(container.querySelector(errorSelector)).toBeNull();
        await blur(getInput());
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('必填');
        expect(api().getTouched('name')).toBe(true);
    });

    it('trigger="mount" 时挂载即校验', async () => {
        const { container } = renderForm({}, [input('name', { trigger: 'mount', rules: [{ required: true, message: '必填' }] })]);
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('必填');
    });

    it('transform 只影响校验，convert 改写存入的值', async () => {
        const { api } = renderForm({}, [input('a', { transform: (value: string) => Number(value), rules: [{ type: 'number', message: '数字' }] }), input('b', { convert: (value: string) => value.toUpperCase() })]);
        const inputs = document.querySelectorAll('input');
        await typeInto(inputs[0], '12');
        await typeInto(inputs[1], 'ab');
        await settle();
        expect(api().getError('a')).toBeUndefined();
        expect(api().getValue('a')).toBe('12');
        expect(api().getValue('b')).toBe('AB');
        expect(inputs[1]).toHaveValue('AB');
    });

    it('helpText 与 extraText 描述控件；出错时 helpText 被错误替换，不再被引用', async () => {
        const { container } = renderForm({}, [input('name', { helpText: text('帮助'), extraText: text('额外'), rules: [{ required: true, message: '必填' }] })]);
        const control = getInput();
        const describedby = control.getAttribute('aria-describedby')?.split(' ') ?? [];
        expect(describedby.map((id) => document.getElementById(id)?.textContent)).toEqual(['帮助', '额外']);
        expect(container.querySelector(`.${prefix}-field-help-text`)).toHaveTextContent('帮助');
        expect(container.querySelector(`.${prefix}-field-extra-bottom`)).toHaveTextContent('额外');
        await typeInto(control, 'a');
        await typeInto(control, '');
        await settle();
        expect(container.querySelector(errorSelector)).toHaveTextContent('必填');
        expect(container.querySelector(errorSelector)).not.toHaveTextContent('帮助');
        expect((getInput().getAttribute('aria-describedby') ?? '').split(' ').map((id) => document.getElementById(id)?.textContent)).toEqual(['额外']);
    });

    it('extraTextPosition="middle" 时额外信息在控件之前', () => {
        const { container } = renderForm({}, [input('name', { extraText: text('额外'), extraTextPosition: 'middle' })]);
        const main = container.querySelector(`.${prefix}-field-main`) as HTMLElement;
        expect(main.firstElementChild).toHaveClass(`${prefix}-field-extra-middle`);
    });

    it('error snippet 自定义错误渲染，错误数组逐项连接', async () => {
        const errorContent = createRawSnippet<[{ error: unknown }]>((props) => ({ render: () => `<b>${String(props().error)}!</b>` }));
        const { api, container } = renderForm({}, [input('a', { error: errorContent }), input('b')]);
        api().setError('a', '错');
        api().setError('b', ['x', 'y']);
        await settle();
        const errors = container.querySelectorAll(errorSelector);
        expect(errors[0].querySelector('b')).toHaveTextContent('错!');
        expect(errors[1]).toHaveTextContent('x, y');
    });

    it('noErrorMessage 不渲染错误，也不设 aria-errormessage', async () => {
        const { api, container } = renderForm({}, [input('a', { noErrorMessage: true })]);
        api().setError('a', '错');
        await settle();
        expect(container.querySelector(errorSelector)).toBeNull();
        expect(getInput()).toHaveAttribute('aria-invalid', 'true');
        expect(getInput()).not.toHaveAttribute('aria-errormessage');
    });

    it('validateStatus 覆盖显示的状态', () => {
        const { container } = renderForm({}, [input('a', { validateStatus: 'warning' })]);
        expect(container.querySelector('.semi-input-wrapper-warning')).not.toBeNull();
    });

    it('pure 只渲染控件，带 field-pure 类', () => {
        const { container } = renderForm({}, [input('a', { pure: true, name: 'n' })]);
        expect(container.querySelector(fieldSelector)).toBeNull();
        expect(container.querySelector(`.${prefix}-field-pure.${prefix}-field-n`)).not.toBeNull();
    });

    it('字段卸载时从表单值中移除，keepState 的字段保留值并在重新挂载后恢复', async () => {
        const { store, api } = renderForm({}, [input('a'), input('b', { keepState: true })]);
        const inputs = document.querySelectorAll('input');
        await typeInto(inputs[0], 'x');
        await typeInto(inputs[1], 'y');
        store.fields[0].shown = false;
        store.fields[1].shown = false;
        flushSync();
        expect(api().getFieldExist('a')).toBe(false);
        expect(api().getValues()).toEqual({ b: 'y' });
        store.fields[1].shown = true;
        flushSync();
        expect(getInput()).toHaveValue('y');
        expect(api().getValues()).toEqual({ b: 'y' });
    });

    it('field 改名后按新路径注册', async () => {
        const { store, api } = renderForm({}, [input('a')]);
        await typeInto(getInput(), 'x');
        store.fields[0].props.field = 'b';
        flushSync();
        await settle();
        expect(api().getFieldExist('b')).toBe(true);
        expect(api().getFieldExist('a')).toBe(false);
    });

    it('formApi.setValue、setValues 推到控件，控件始终显示表单值', async () => {
        const { api } = renderForm({}, [input('a'), input('b')]);
        api().setValue('a', 'one');
        await settle();
        expect(document.querySelectorAll('input')[0]).toHaveValue('one');
        api().setValues({ b: 'two' }, { isOverride: true });
        await settle();
        expect(document.querySelectorAll('input')[0]).toHaveValue('');
        expect(document.querySelectorAll('input')[1]).toHaveValue('two');
    });

    it('convert 拒绝的输入不留在控件里', async () => {
        renderForm({}, [input('a', { convert: (value: string) => value.replace(/\d/g, '') })]);
        await typeInto(getInput(), 'a1');
        await settle();
        expect(getInput()).toHaveValue('a');
    });

    it('不在 Form 内时字段不渲染并给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { container } = render(FormInput, { props: { field: 'a' } });
        expect(container.querySelector('input')).toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});

const scoped = (field: string) => `[x-field-id="${field}"]`;
const inputOf = (field: string) => document.querySelector<HTMLInputElement>(`${scoped(field)} input`) as HTMLInputElement;
const errorOf = (field: string) => document.querySelector(`${scoped(field)} ${errorSelector}`);

describe('Svelte Form 字段：标签与布局', () => {
    it('fieldLabel 里有多个节点时整体是标签内容，inset 布局同样使用它', () => {
        const nodes = createRawSnippet(() => ({ render: () => '<span><b>A</b>b</span>' }));
        const { container } = renderForm({}, [input('top', { fieldLabel: nodes }), input('inset', { labelPosition: 'inset', fieldLabel: nodes })]);
        expect(container.querySelector(`.${prefix}-field-label-text`)?.textContent?.trim()).toBe('Ab');
        // one control per layout, both named by the same content
        expect(screen.getAllByRole('textbox', { name: 'Ab' })).toHaveLength(2);
    });

    it('inset 布局下没有 label 时以 field 为标签', () => {
        renderForm({}, [input('empty', { labelPosition: 'inset' })]);
        expect(screen.getByRole('textbox', { name: 'empty' })).toBeInTheDocument();
    });

    it('字段的 labelPosition 与 labelAlign 优先于 Form 的设置', () => {
        const { container } = renderForm({ labelPosition: 'top', labelAlign: 'right' }, [input('a', { labelPosition: 'left', labelAlign: 'left' }), input('b')]);
        expect(container.querySelector(scoped('a'))).toHaveAttribute('x-label-pos', 'left');
        expect(container.querySelector(scoped('b'))).toHaveAttribute('x-label-pos', 'top');
        expect(container.querySelector(`${scoped('a')} .${prefix}-field-label-left`)).not.toBeNull();
        expect(container.querySelector(`${scoped('b')} .${prefix}-field-label-right`)).not.toBeNull();
    });

    it('未渲染 label 时，控件不引用不存在的 id 作为标签', () => {
        renderForm({}, [input('name', { 'aria-label': 'Name', noLabel: true }), input('pure', { id: 'pure', pure: true }), input('inset', { id: 'inset', label: 'Inset', labelPosition: 'inset', pure: true })]);
        expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-labelledby');
        expect(document.getElementById('pure')).not.toHaveAttribute('aria-labelledby');
        expect(screen.getByRole('textbox', { name: 'Inset' })).toHaveAttribute('aria-labelledby', 'inset-label');
    });

    it('name 写入字段外层的类名', () => {
        const { container } = renderForm({}, [input('name', { name: 'company' })]);
        expect(container.querySelector(`${fieldSelector}.${prefix}-field-company`)).not.toBeNull();
    });

    it('字段带自身 labelCol 与 wrapperCol 时，在自己的 Row 中布局', () => {
        const { container } = renderForm({}, [input('name', { label: 'Name', labelCol: { span: 6 }, wrapperCol: { span: 18 } })]);
        const row = container.querySelector(`${fieldSelector} > .semi-row`);
        expect(row).not.toBeNull();
        expect(row?.querySelector('.semi-col-6')).not.toBeNull();
        expect(row?.querySelector(':scope > .semi-col-18')).not.toBeNull();
    });

    it('field 支持点号与下标路径，label 默认取路径原文', () => {
        const fields = ['username', 'user[0]', 'siblings.1', 'siblings[2]', 'parents[0].name', "parents[1]['name']"];
        const { container } = renderForm(
            { initValues: { username: 'a', user: ['b'], siblings: [0, 'c', 'd'], parents: [{ name: 'e' }, { name: 'f' }] } },
            fields.map((field) => input(field))
        );
        expect(Array.from(container.querySelectorAll<HTMLInputElement>('input'), (el) => el.value)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(Array.from(container.querySelectorAll(labelSelector), (label) => label.textContent?.trim())).toEqual(fields);
    });

    it('数组路径字段 value[0].name 卸载后，其他数组项保持原索引', async () => {
        const { store, api } = renderForm({ initValues: { value: [{ name: 'kkk' }, { name: 'ccc' }, { name: 'ddd' }] } }, [input('value[0].name')]);
        expect(getInput()).toHaveValue('kkk');
        store.fields[0].shown = false;
        flushSync();
        const value = api().getValue('value') as unknown[];
        expect(value).toHaveLength(3);
        expect(value[0]).toBeUndefined();
        expect(value.slice(1)).toEqual([{ name: 'ccc' }, { name: 'ddd' }]);
    });
});

describe('Svelte Form 字段：校验', () => {
    it('validator 与 rules 一起校验，validator 收到转换后的值与全部表单值', async () => {
        const validate = vi.fn<(value: unknown, values: unknown) => string>((value) => (value !== 'semi' ? 'invalid' : ''));
        const { api } = renderForm({}, [
            input('name', {
                trigger: 'change',
                validator: validate,
                rules: [
                    { type: 'string', message: 'rules error1' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'rules error2' },
                ],
            }),
        ]);
        await typeInto(getInput(), 'milk');
        await settle();
        expect(validate).toHaveBeenCalledWith('milk', { name: 'milk' });
        expect(errorOf('name')?.textContent?.trim()).toBe('invalid');
        await typeInto(getInput(), 'semi');
        await settle();
        expect(validate).toHaveBeenLastCalledWith('semi', { name: 'semi' });
        expect(api().getError('name')).toBeUndefined();
        expect(errorOf('name')).toBeNull();
    });

    it('异步 validator 按输入顺序给出错误，通过后清除错误', async () => {
        const validate = vi.fn<(value: string) => Promise<string>>((value) => new Promise((resolve) => setTimeout(() => resolve(value !== 'semi' ? 'invalid' : ''), 20)));
        const { api } = renderForm({}, [input('name', { trigger: 'change', validator: validate })]);
        await typeInto(getInput(), 'milk');
        expect(validate).toHaveBeenNthCalledWith(1, 'milk', { name: 'milk' });
        await new Promise((resolve) => setTimeout(resolve, 60));
        await settle();
        expect(errorOf('name')?.textContent?.trim()).toBe('invalid');
        expect(api().getError('name')).toBe('invalid');
        await typeInto(getInput(), 'semi');
        expect(validate).toHaveBeenNthCalledWith(2, 'semi', { name: 'semi' });
        await new Promise((resolve) => setTimeout(resolve, 60));
        await settle();
        expect(errorOf('name')).toBeNull();
        expect(api().getError('name')).toBeUndefined();
    });

    it('rules 的类型规则校验写入的值，同一字段的多条错误合并显示', async () => {
        const { api } = renderForm({}, [
            input('name', {
                trigger: 'change',
                rules: [
                    { type: 'string', message: 'type error' },
                    { validator: (_rule: unknown, value: unknown) => value === 'muji', message: 'not muji' },
                ],
            }),
        ]);
        // a DOM input always emits strings, so put a number into the field through formApi to break the type rule
        api().setValue('name', 2);
        await api()
            .validate()
            .catch(() => undefined);
        await settle();
        expect(errorOf('name')?.textContent?.trim()).toBe('type error, not muji');
        await typeInto(getInput(), 'semi');
        await settle();
        expect(errorOf('name')?.textContent?.trim()).toBe('not muji');
    });

    it('trigger 为 mount、change、blur 时分别在挂载、变化、失焦时校验', async () => {
        const validate = (value: unknown) => (value !== 'semi' ? 'invalid' : '');
        renderForm({}, [input('c', { trigger: 'mount', validator: validate }), input('a', { trigger: 'change', validator: validate }), input('b', { trigger: 'blur', initValue: 'milk', validator: validate })]);
        await settle();
        expect(errorOf('c')?.textContent?.trim()).toBe('invalid');
        await typeInto(inputOf('a'), 'trigger');
        await typeInto(inputOf('b'), 'trigger');
        await settle();
        expect(errorOf('a')?.textContent?.trim()).toBe('invalid');
        expect(errorOf('b')).toBeNull();
        await blur(inputOf('b'));
        await settle();
        expect(errorOf('b')?.textContent?.trim()).toBe('invalid');
    });

    it('trigger 同时含 change 与 blur 时，两种时机都校验', async () => {
        const validate = (value: unknown) => {
            if (value === 'changeVal') {
                return 'changeError';
            }
            return value === 'blurVal' ? 'blurError' : '';
        };
        renderForm({}, [input('a', { trigger: ['change', 'blur'], validator: validate })]);
        await typeInto(getInput(), 'changeVal');
        await settle();
        expect(errorOf('a')?.textContent?.trim()).toBe('changeError');
        await typeInto(getInput(), 'blurVal');
        await blur(getInput());
        await settle();
        expect(errorOf('a')?.textContent?.trim()).toBe('blurError');
    });

    it('先发出的异步校验晚于新校验结束时，不覆盖新的错误', async () => {
        let outdated: (() => void) | undefined;
        const { api, container } = renderForm({}, [
            input('text', {
                rules: [
                    { type: 'string', max: 10 },
                    {
                        asyncValidator(_rule: unknown, _value: unknown, callback: () => void) {
                            if (!outdated) {
                                outdated = callback;
                            } else {
                                callback();
                            }
                        },
                    },
                ],
            }),
        ]);
        await typeInto(getInput(), 'semi');
        await settle();
        expect(outdated).toBeDefined();
        expect(api().getError('text')).toBeUndefined();
        await typeInto(getInput(), 'Prefer knowledge to wealth, for the one is transitory, the other perpetual.');
        await settle();
        expect(api().getError('text')).not.toBeUndefined();
        // nothing signals that the first run was dropped, so give its promise chain a moment to settle
        outdated?.();
        await new Promise((resolve) => setTimeout(resolve, 50));
        await settle();
        expect(api().getError('text')).not.toBeUndefined();
        expect(container.querySelector(errorSelector)).not.toBeNull();
    });

    it('validateStatus 属性优先于校验状态，错误信息照常显示', async () => {
        const { api, container } = renderForm({}, [input('name', { validateStatus: 'warning', validator: () => 'err' })]);
        await expect(api().validate()).rejects.toEqual({ name: 'err' });
        await settle();
        expect(container.querySelector('.semi-input-wrapper-warning')).not.toBeNull();
        expect(container.querySelector('.semi-input-wrapper-error')).toBeNull();
        expect(errorOf('name')).toHaveTextContent('err');
    });

    // the error still reaches the window, which a production page may swallow the same way
    it('有 initValue 时 onChange 抛错，表单值与输入框都回滚', async () => {
        const swallow = (event: ErrorEvent) => event.preventDefault();
        window.addEventListener('error', swallow);
        const { api } = renderForm({ initValues: { name: 'init' } }, [
            input('name', {
                onChange: () => {
                    throw new Error('rejected');
                },
            }),
        ]);
        await typeInto(getInput(), 'a');
        await settle();
        window.removeEventListener('error', swallow);
        expect(api().getValue('name')).toBe('init');
        expect(getInput()).toHaveValue('init');
    });
});
