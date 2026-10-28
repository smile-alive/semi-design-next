/** @jsxImportSource vue */
import { defineComponent, KeepAlive, nextTick, reactive, ref } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { Form, FormInputGroup, withField, type FormApi } from '..';
import { FormInput, getInputs, renderForm } from './fixtures/fields';
import GroupToggle from './fixtures/group-toggle.vue';

const groupError = (container: Element) => container.querySelector('.semi-form-field-group .semi-form-field-error-message');

const Plain = defineComponent({
    props: { modelValue: { type: String, default: undefined } },
    emits: ['change'],
    setup(props, { emit }) {
        return () => <input value={props.modelValue ?? ''} onInput={(event: Event) => emit('change', (event.target as HTMLInputElement).value)} />;
    },
});
const FormPlain = withField(Plain);

describe('withField Vue 专属行为', () => {
    it('modelValue、model-value 与 v-model 被剔除并在开发模式警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const onUpdate = vi.fn<(value: unknown) => void>();
        // the field type rejects these keys, so they come in as untyped attributes
        const vModel: Record<string, unknown> = { modelValue: 'outside', 'onUpdate:modelValue': onUpdate };
        const kebab: Record<string, unknown> = { 'model-value': 'outside' };
        const { api } = renderForm({}, () => (
            <>
                <FormInput field="a" {...vModel} />
                <FormInput field="b" {...kebab} />
            </>
        ));
        const [a, b] = getInputs();
        expect(a).toHaveValue('');
        expect(b).toHaveValue('');
        await fireEvent.update(a, 'typed');
        expect(api().getValue('a')).toBe('typed');
        expect(onUpdate).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('FormInput takes its value from the Form'));
        expect(warn.mock.calls.some(([message]) => String(message).includes('model-value'))).toBe(true);
        warn.mockRestore();
    });

    it('KeepAlive 内首次挂载只注册一次', async () => {
        const Group = defineComponent(() => () => <FormInputGroup label="group">{() => <FormInput field="a" trigger="mount" validator={() => 'a-err'} />}</FormInputGroup>);
        const { container } = renderForm({}, () => <KeepAlive>{() => <Group />}</KeepAlive>);
        await waitFor(() => expect(groupError(container)).toHaveTextContent(/^a-err$/));
    });

    it('未声明 validateStatus、insetLabelId 的组件收不到这两个属性，inset 回退为 top 并警告', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { api, container } = renderForm({}, () => <FormPlain field="plain" id="plain" label="Plain" labelPosition="inset" />);
        api().setError('plain', 'bad');
        await nextTick();
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).not.toHaveAttribute('validatestatus');
        expect(input).not.toHaveAttribute('insetlabelid');
        expect(container.querySelector('.semi-form-field')).toHaveAttribute('x-label-pos', 'top');
        expect(input).toHaveAttribute('aria-labelledby', 'plain-label');
        expect(document.getElementById('plain-label')).toHaveTextContent('Plain');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("laid out with labelPosition 'top'"));
        warn.mockRestore();
    });

    it('包装原生 input 元素', async () => {
        const NativeInput = withField('input', {
            valueKey: 'value',
            onKeyChangeFnName: 'input',
            valuePath: 'target.value',
        });
        const onInput = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({ initValues: { native: 'init' } }, () => <NativeInput field="native" label="Native" onInput={onInput} />);
        const input = screen.getByRole('textbox', { name: 'Native' });
        expect(input).toHaveValue('init');
        await fireEvent.update(input, 'typed');
        expect(api().getValue('native')).toBe('typed');
        expect(onInput).toHaveBeenCalledWith(expect.any(Event), { native: 'typed' });
    });

    it('被包装组件的具名插槽原样转发，字段壳消费的插槽不转发', () => {
        const received: string[] = [];
        const Slotted = withField(
            defineComponent({
                props: { modelValue: { type: String, default: undefined } },
                setup(_, { slots }) {
                    return () => {
                        received.push(...Object.keys(slots));
                        return (
                            <div class="slotted">
                                {slots.default?.()}
                                {slots.suffix?.()}
                                {slots.label?.()}
                            </div>
                        );
                    };
                },
            })
        );
        const { container } = renderForm({}, () => (
            <Slotted field="slotted">
                {{
                    default: () => 'body',
                    suffix: () => 'suffix',
                    label: () => 'inner-label',
                    fieldLabel: () => 'Field label',
                    labelExtra: () => 'extra',
                    helpText: () => 'help',
                    extraText: () => 'extra text',
                    error: () => 'error',
                }}
            </Slotted>
        ));
        expect(container.querySelector('.slotted')).toHaveTextContent('bodysuffixinner-label');
        expect(new Set(received)).toEqual(new Set(['default', 'suffix', 'label']));
        expect(container.querySelector('.semi-form-field-label-text')).toHaveTextContent('Field label');
    });

    it('使用方的 blur 监听与字段的 blur 处理都执行', async () => {
        const onBlur = vi.fn<(...args: unknown[]) => void>();
        const { api } = renderForm({}, () => <FormInput field="name" onBlur={onBlur} />);
        await fireEvent.focusOut(getInputs()[0]);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(api().getTouched('name')).toBe(true);
    });

    it('使用方的 aria-labelledby 在 label id 之前，aria-describedby 与 extraText 合并', () => {
        renderForm({}, () => (
            <FormInput field="name" id="name" label="Name" aria-labelledby="outer" aria-describedby="hint">
                {{ extraText: () => 'extra' }}
            </FormInput>
        ));
        const input = getInputs()[0];
        expect(input).toHaveAttribute('aria-labelledby', 'outer name-label');
        expect(input).toHaveAttribute('aria-describedby', 'hint name-extraText');
    });

    it('label 对象 required 为 true 时控件带 aria-required', () => {
        renderForm({}, () => (
            <>
                <FormInput field="required" label={{ text: 'Required', required: true }} />
                <FormInput field="optional" label={{ text: 'Optional', required: true, optional: true }} />
            </>
        ));
        const [required, optional] = getInputs();
        expect(required).toHaveAttribute('aria-required', 'true');
        expect(optional).toHaveAttribute('aria-required', 'false');
    });

    it('FormInputGroup 子项以模板写法增删时，组级错误跟随且没有告警', async () => {
        const warn = vi.spyOn(console, 'warn');
        let api: FormApi | undefined;
        const view = render(GroupToggle, {
            props: { showB: true, onApi: (formApi: FormApi) => (api = formApi) },
        });
        await waitFor(() => expect(groupError(view.container)).toHaveTextContent(/^a-err, b-err$/));
        await view.rerender({ showB: false });
        expect(api?.getFieldExist('b')).toBe(false);
        expect(groupError(view.container)).toHaveTextContent(/^a-err$/);
        await view.rerender({ showB: true });
        await waitFor(() => expect(groupError(view.container)).toHaveTextContent(/^a-err, b-err$/));
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('FormInputGroup 子项以 h() 写法增删时，组级错误跟随', async () => {
        const showB = ref(true);
        const { container } = renderForm({}, () => (
            <FormInputGroup label="group">
                {() => (
                    <>
                        <FormInput field="a" trigger="mount" validator={() => 'a-err'} />
                        {showB.value && <FormInput field="b" trigger="mount" validator={() => 'b-err'} />}
                    </>
                )}
            </FormInputGroup>
        ));
        await waitFor(() => expect(groupError(container)).toHaveTextContent(/^a-err, b-err$/));
        showB.value = false;
        await nextTick();
        expect(groupError(container)).toHaveTextContent(/^a-err$/);
    });

    it('initValues 为 reactive 对象时拷贝其数据，之后修改源对象不影响表单', async () => {
        const initValues = reactive({ user: { name: 'semi' }, tags: ['a'] });
        const { api } = renderForm({ initValues }, () => (
            <>
                <FormInput field="user.name" />
                <FormInput field="tags[0]" />
            </>
        ));
        expect(api().getValues()).toEqual({ user: { name: 'semi' }, tags: ['a'] });
        initValues.user.name = 'changed';
        initValues.tags.push('b');
        await nextTick();
        expect(getInputs()[0]).toHaveValue('semi');
        api().setValue('user.name', 'typed');
        api().reset();
        await nextTick();
        expect(api().getValue('user')).toEqual({ name: 'semi' });
        expect(Form).toBeDefined();
    });
});
