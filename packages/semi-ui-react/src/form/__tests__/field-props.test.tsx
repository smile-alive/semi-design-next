import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { SimpleValueType } from '../../cascader/index';
import type { BasicSelectValue } from '../../select/index';
import type { TreeNodeData } from '../../tree/interface';
import type { ArrayFieldProps } from '../array-field';
import {
    type FormAutoComplete,
    type FormCheckbox,
    type FormCheckboxGroup,
    type FormDatePicker,
    type FormInputNumber,
    type FormPinCode,
    type FormRadio,
    type FormRadioGroup,
    type FormRating,
    type FormSlider,
    type FormSwitch,
    type FormTagInput,
    type FormTextArea,
    type FormTimePicker,
    type FormUpload,
    FormCascader,
    FormInput,
    FormSelect,
    FormTreeSelect,
} from '../field';
import type { InputGroupProps } from '../group';
import withField from '../hoc/with-field';
import type useForm from '../hooks/use-form';
import type { BaseFormProps } from '../interface';

type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;
type InputFieldProps = PropsOf<typeof FormInput>;

function Custom(props: { size: 'small' | 'large'; value?: string; onChange?: (value: string) => void }) {
    return <span>{props.size}</span>;
}

// The assertions are checked by typecheck; the runtime body only keeps the file a valid test.
describe('Field Props 类型', () => {
    it('withField 的 Props 从被包装组件推断，不接受 defaultValue', () => {
        const CustomField = withField(Custom);
        expectTypeOf<PropsOf<typeof CustomField>>().not.toBeAny();
        expectTypeOf<PropsOf<typeof CustomField>>().toHaveProperty('size').toEqualTypeOf<'small' | 'large'>();
        expectTypeOf<PropsOf<typeof CustomField>>().toHaveProperty('field').toEqualTypeOf<string>();
        expectTypeOf<'defaultValue'>().not.toExtend<keyof PropsOf<typeof CustomField>>();
        expectTypeOf<'defaultValue'>().not.toExtend<keyof InputFieldProps>();
        expect(CustomField).toBeTypeOf('function');
    });

    it('trigger 只接受校验时机及其数组', () => {
        expectTypeOf<['blur', 'change']>().toExtend<InputFieldProps['trigger']>();
        expectTypeOf<'mount'>().toExtend<InputFieldProps['trigger']>();
        expectTypeOf<'focus'>().not.toExtend<InputFieldProps['trigger']>();
        expectTypeOf<['blur', 'focus']>().not.toExtend<InputFieldProps['trigger']>();
    });

    it('字段公共 Props 声明 emptyValue', () => {
        expectTypeOf<InputFieldProps>().toHaveProperty('emptyValue').toEqualTypeOf<unknown>();
        expect(FormInput).toBeDefined();
    });

    it('各字段组件的 Props 仍可推断', () => {
        expectTypeOf<InputFieldProps>().toHaveProperty('placeholder');
        expectTypeOf<PropsOf<typeof FormInputNumber>>().toHaveProperty('step');
        expectTypeOf<PropsOf<typeof FormTextArea>>().toHaveProperty('rows');
        expectTypeOf<PropsOf<typeof FormCheckboxGroup>>().toHaveProperty('options');
        expectTypeOf<PropsOf<typeof FormCheckbox>>().toHaveProperty('indeterminate');
        expectTypeOf<PropsOf<typeof FormRadioGroup>>().toHaveProperty('options');
        expectTypeOf<PropsOf<typeof FormRadio>>().toHaveProperty('value');
        expectTypeOf<PropsOf<typeof FormDatePicker>>().toHaveProperty('type');
        expectTypeOf<PropsOf<typeof FormSwitch>>().toHaveProperty('size');
        expectTypeOf<PropsOf<typeof FormSlider>>().toHaveProperty('max');
        expectTypeOf<PropsOf<typeof FormTimePicker>>().toHaveProperty('format');
        expectTypeOf<PropsOf<typeof FormTreeSelect>>().toHaveProperty('treeData');
        expectTypeOf<PropsOf<typeof FormCascader>>().toHaveProperty('treeData');
        expectTypeOf<PropsOf<typeof FormRating>>().toHaveProperty('count');
        expectTypeOf<PropsOf<typeof FormAutoComplete>>().toHaveProperty('data');
        expectTypeOf<PropsOf<typeof FormUpload>>().toHaveProperty('action');
        expectTypeOf<PropsOf<typeof FormTagInput>>().toHaveProperty('maxTagCount');
        expectTypeOf<PropsOf<typeof FormPinCode>>().toHaveProperty('count');
        expectTypeOf<PropsOf<typeof FormDatePicker>>().toHaveProperty('field').toEqualTypeOf<string>();
        expectTypeOf<PropsOf<typeof FormUpload>>().toHaveProperty('field').toEqualTypeOf<string>();
    });

    it('Form.Select 接受 multiple，且不接受 defaultValue', () => {
        type SelectFieldProps = PropsOf<typeof FormSelect>;
        expectTypeOf<{ field: string; multiple: true }>().toExtend<SelectFieldProps>();
        expectTypeOf<{ field: string; multiple: false }>().toExtend<SelectFieldProps>();
        expectTypeOf<SelectFieldProps>().not.toHaveProperty('defaultValue');
    });

    it('Form.Select、Form.TreeSelect、Form.Cascader 的行内 onChange 按 multiple 与 onChangeWithObject 推断', () => {
        // JSX infers the mode from the `multiple` and `onChangeWithObject` attributes, as on the bare components
        const elements = (
            <>
                <FormSelect field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<BasicSelectValue | undefined>()} />
                <FormSelect multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<BasicSelectValue[]>()} />
                <FormTreeSelect
                    field="a"
                    onChange={(v, node) => {
                        expectTypeOf(v).toEqualTypeOf<string | number | undefined>();
                        expectTypeOf(node).toEqualTypeOf<TreeNodeData | undefined>();
                    }}
                />
                <FormTreeSelect multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<(string | number)[]>()} />
                <FormTreeSelect multiple field="a" onChange={(nodes) => expectTypeOf(nodes).toEqualTypeOf<TreeNodeData[]>()} onChangeWithObject />
                <FormCascader field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<SimpleValueType[]>()} />
                <FormCascader multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<SimpleValueType[][]>()} />
            </>
        );
        expect(elements).toBeTruthy();
    });

    it('Form 的 form 取 useForm 返回的 formApi', () => {
        type Values = { name: string };
        expectTypeOf<BaseFormProps<Values>['form']>().not.toBeAny();
        expectTypeOf<ReturnType<typeof useForm<Values>>[0]>().toExtend<BaseFormProps<Values>['form']>();
        expectTypeOf<{ getValue: () => string }>().not.toExtend<BaseFormProps<Values>['form']>();
    });

    it('ArrayField 的 field 与 children 必填，InputGroup 的 label 接受文本', () => {
        expectTypeOf<{ initValue?: unknown[] }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string; children: () => null }>().toExtend<ArrayFieldProps>();
        expectTypeOf<'Name'>().toExtend<InputGroupProps['label']>();
        expectTypeOf<{ text: string; required: boolean }>().toExtend<InputGroupProps['label']>();
    });
});
