import type { Component } from 'solid-js';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { FieldPath, FieldPathValue, FormState } from '@fibrae/semi-foundation/form/interface';
import {
    type ArrayFieldProps,
    type FieldProps,
    type FormApi,
    type FormCheckboxProps,
    type FormProps,
    type FormRadioProps,
    type FormUploadProps,
    type InputGroupProps,
    type FormAutoComplete,
    type FormCheckbox,
    type FormCheckboxGroup,
    type FormDatePicker,
    type FormInput,
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
    type useForm,
    FormCascader,
    FormSelect,
    FormTreeSelect,
    withField,
} from '..';
import type { SimpleValueType } from '../../cascader';
import type { BasicSelectValue } from '../../select';
import type { TreeNodeData } from '../../tree/interface';

type PropsOf<C> = C extends Component<infer P> ? P : never;
type InputFieldProps = PropsOf<typeof FormInput>;

interface Values {
    name: string;
    profile: { age: number; address: { city: string } };
}

interface ArrayValues {
    tags: string[];
    matrix: number[][];
    users: { name: string; roles: { id: number }[] }[];
}

interface TreeNode {
    label: string;
    children: TreeNode[];
}

function Custom(props: { size: 'small' | 'large'; value?: string; onChange?: (value: string) => void }) {
    return <span>{props.size}</span>;
}

// The assertions are checked by typecheck; the runtime body only keeps the file a valid test.
describe('FormApi 路径类型', () => {
    it('嵌套对象路径被接受，拼错的路径无法通过编译', () => {
        expectTypeOf<'profile.address.city'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.adress.city'>().not.toExtend<FieldPath<Values>>();
        expectTypeOf<FieldPathValue<Values, 'profile.age'>>().toEqualTypeOf<number>();

        const check = (api: FormApi<Values>) => {
            api.setValue('profile.address.city', 'x');
            // @ts-expect-error misspelled nested path
            api.setValue('profile.adress.city', 'x');
            // @ts-expect-error unknown nested key
            api.getValue('profile.height');
        };
        expect(check).toBeTypeOf('function');
    });

    it('按路径操作的方法都接受嵌套与数组路径', () => {
        const check = (api: FormApi<ArrayValues>) => {
            api.setValue('users[0].roles[1].id', 1);
            expectTypeOf(api.getValue('users[0].name')).toEqualTypeOf<string>();
            api.setError('users[0].name', 'bad');
            api.setTouched('tags[0]', true);
            api.scrollToField('users[1].name');
            api.scrollToError({ field: 'users[0].name' });
            expectTypeOf(api.validate(['users[0].name'])).toEqualTypeOf<Promise<ArrayValues>>();
            // @ts-expect-error a misspelled path
            api.setError('user[0].name', 'bad');
        };
        expect(check).toBeTypeOf('function');
    });

    it('递归的值类型按深度上限展开路径', () => {
        expectTypeOf<'children[0].children[1].label'>().toExtend<FieldPath<TreeNode>>();
    });
});

describe('字段 onChange 类型', () => {
    it('onChange 的末参是最新的表单值，控件参数不足两个时补齐', () => {
        type Props = FieldProps<{ onChange?: (value: string) => void }>;
        expectTypeOf<NonNullable<Props['onChange']>>().parameters.toEqualTypeOf<[string, undefined, Record<string, any>]>();
        type Two = FieldProps<{ onChange?: (value: string, e: Event) => void }>;
        expectTypeOf<NonNullable<Two['onChange']>>().parameters.toEqualTypeOf<[string, Event, Record<string, any>]>();
    });
});

describe('字段 Props 类型', () => {
    it('FormCheckbox、FormRadio 不接受 checked、defaultChecked，FormUpload 不接受 fileList', () => {
        expectTypeOf<'checked'>().not.toExtend<keyof FormCheckboxProps>();
        expectTypeOf<'defaultChecked'>().not.toExtend<keyof FormCheckboxProps>();
        expectTypeOf<'checked'>().not.toExtend<keyof FormRadioProps>();
        expectTypeOf<FormCheckboxProps>().toHaveProperty('indeterminate');
        expectTypeOf<FormRadioProps>().toHaveProperty('value');
        expectTypeOf<'fileList'>().not.toExtend<keyof FormUploadProps>();
        expectTypeOf<FormUploadProps>().toHaveProperty('action');
    });

    it('withField 的 Props 从被包装组件推断，不接受 defaultValue', () => {
        const CustomField = withField(Custom);
        expectTypeOf<PropsOf<typeof CustomField>>().not.toBeAny();
        expectTypeOf<PropsOf<typeof CustomField>>().toHaveProperty('size').toEqualTypeOf<'small' | 'large'>();
        expectTypeOf<PropsOf<typeof CustomField>>().toHaveProperty('field').toEqualTypeOf<string>();
        expectTypeOf<'defaultValue'>().not.toExtend<keyof PropsOf<typeof CustomField>>();
        expectTypeOf<'defaultValue'>().not.toExtend<keyof InputFieldProps>();
        expect(CustomField).toBeTypeOf('function');
    });

    it('trigger 只接受校验时机及其数组，公共 Props 声明 emptyValue', () => {
        expectTypeOf<['blur', 'change']>().toExtend<InputFieldProps['trigger']>();
        expectTypeOf<'mount'>().toExtend<InputFieldProps['trigger']>();
        expectTypeOf<'focus'>().not.toExtend<InputFieldProps['trigger']>();
        expectTypeOf<InputFieldProps>().toHaveProperty('emptyValue').toEqualTypeOf<unknown>();
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
    });

    it('FormSelect、FormTreeSelect、FormCascader 的行内 onChange 按 multiple 与 onChangeWithObject 推断', () => {
        const elements = () => (
            <>
                <FormSelect field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<BasicSelectValue | undefined>()} />
                <FormSelect multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<BasicSelectValue[]>()} />
                <FormTreeSelect field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<string | number | undefined>()} />
                <FormTreeSelect multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<(string | number)[]>()} />
                <FormTreeSelect multiple field="a" onChange={(nodes) => expectTypeOf(nodes).toEqualTypeOf<TreeNodeData[]>()} onChangeWithObject />
                <FormCascader field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<SimpleValueType[]>()} />
                <FormCascader multiple field="a" onChange={(v) => expectTypeOf(v).toEqualTypeOf<SimpleValueType[][]>()} />
            </>
        );
        expect(elements).toBeTypeOf('function');
    });
});

describe('Form Props 类型', () => {
    type Errors = NonNullable<FormState<ArrayValues>['errors']>;

    it('Form 的 form 取 useForm 返回的 formApi', () => {
        expectTypeOf<FormProps<Values>['form']>().not.toBeAny();
        expectTypeOf<ReturnType<typeof useForm<Values>>[0]>().toExtend<FormProps<Values>['form']>();
        expectTypeOf<{ getValue: () => string }>().not.toExtend<FormProps<Values>['form']>();
    });

    it('表单级 validator 返回嵌套的错误，onErrorChange 的 errors 与 formState.errors 同形', () => {
        type Result = Awaited<ReturnType<NonNullable<FormProps<ArrayValues>['validator']>>>;
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<Result>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Result>();
        expectTypeOf<Parameters<NonNullable<FormProps<ArrayValues>['onErrorChange']>>[0]>().toEqualTypeOf<Errors>();
        expectTypeOf<'form invalid'>().toExtend<Parameters<NonNullable<FormProps<ArrayValues>['onSubmitFail']>>[0]>();
    });

    it('ArrayField 的 field 与 children 必填，InputGroup 的 label 接受文本', () => {
        expectTypeOf<{ initValue?: unknown[] }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string; children: () => null }>().toExtend<ArrayFieldProps>();
        expectTypeOf<'Name'>().toExtend<InputGroupProps['label']>();
        expectTypeOf<{ text: string; required: boolean }>().toExtend<InputGroupProps['label']>();
    });
});
