import { defineComponent, type PropType } from 'vue';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import * as z from 'zod';
import type { FieldPath, FieldPathValue, FormState } from '@fibrae/semi-foundation/components/form/interface';
import {
    FormInput,
    withField,
    type ArrayFieldProps,
    type FormApi,
    type FormCheckboxProps,
    type FormEmits,
    type FormInputGroupProps,
    type FormProps,
    type FormRadioProps,
    type FormSelectProps,
    type RuleItem,
    type useForm,
    type FormAutoComplete,
    type FormCascader,
    type FormCheckboxGroup,
    type FormDatePicker,
    type FormInputNumber,
    type FormPinCode,
    type FormRadioGroup,
    type FormRating,
    type FormSelect,
    type FormSlider,
    type FormSwitch,
    type FormTagInput,
    type FormTextArea,
    type FormTimePicker,
    type FormTreeSelect,
    type FormUpload,
} from '..';
import FieldTypes from './fixtures/field-types.vue';
import Typed from './fixtures/typed.vue';

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

// The assertions are checked by typecheck; the runtime body only keeps the file a valid test.
describe('Form 类型', () => {
    it('Form 的 form 取 useForm 返回的 formApi', () => {
        expectTypeOf<FormProps<Values>['form']>().not.toBeAny();
        expectTypeOf<ReturnType<typeof useForm<Values>>['formApi']>().toExtend<FormProps<Values>['form']>();
        expectTypeOf<{ getValue: () => string }>().not.toExtend<FormProps<Values>['form']>();
    });

    it('ArrayField 的 field 必填，FormInputGroup 的 label 接受文本', () => {
        expectTypeOf<{ initValue?: unknown[] }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string }>().toExtend<ArrayFieldProps>();
        expectTypeOf<'Name'>().toExtend<FormInputGroupProps['label']>();
        expectTypeOf<{ text: string; required: boolean }>().toExtend<FormInputGroupProps['label']>();
    });

    it('withField 包装原生元素时，Props 取该元素的属性且不接受值属性', () => {
        const NativeInput = withField('input', { valueKey: 'value', onKeyChangeFnName: 'input' });
        type NativeProps = InstanceType<typeof NativeInput>['$props'];
        expectTypeOf<NativeProps>().toHaveProperty('placeholder');
        expectTypeOf<NativeProps['field']>().toEqualTypeOf<string>();
        expectTypeOf<NativeProps['value']>().toEqualTypeOf<undefined>();
        expect(NativeInput).toBeTypeOf('object');
    });

    it('latestValues 追加在 onKeyChangeFnName 对应的监听上，其他监听保持原签名', () => {
        const NativeInput = withField('input', { valueKey: 'value', onKeyChangeFnName: 'input' });
        type NativeProps = InstanceType<typeof NativeInput>['$props'];
        expectTypeOf<Parameters<NonNullable<NativeProps['onInput']>>>().toEqualTypeOf<[payload: InputEvent, latestValues: Record<string, any>]>();
        expectTypeOf<Parameters<NonNullable<NativeProps['onChange']>>>().toEqualTypeOf<[payload: Event]>();
        expect(NativeInput).toBeTypeOf('object');
    });

    it('模板中字段的 change 末参是最新的表单值（fixtures/typed.vue 由 vue-tsc 检查）', () => {
        expect(Typed).toBeDefined();
    });
});

const Custom = defineComponent({
    props: { size: { type: String as PropType<'small' | 'large'>, required: true }, modelValue: String },
    emits: { change: (_value: string) => true },
    setup: () => () => null,
});

type PropsOf<C> = C extends new () => { $props: infer P } ? P : C extends (props: infer P) => unknown ? P : never;
type InputFieldProps = PropsOf<typeof FormInput>;

describe('Field Props 类型', () => {
    it('withField 的 Props 从被包装组件推断，不接受 defaultValue', () => {
        const CustomField = withField(Custom);
        type CustomFieldProps = PropsOf<typeof CustomField>;
        expectTypeOf<CustomFieldProps>().not.toBeAny();
        expectTypeOf<CustomFieldProps['size']>().toEqualTypeOf<'small' | 'large'>();
        expectTypeOf<CustomFieldProps['field']>().toEqualTypeOf<string>();
        expectTypeOf<CustomFieldProps['defaultValue']>().toEqualTypeOf<undefined>();
        expectTypeOf<CustomFieldProps['modelValue']>().toEqualTypeOf<undefined>();
        expectTypeOf<InputFieldProps['defaultValue']>().toEqualTypeOf<undefined>();
        expect(CustomField).toBeTypeOf('object');
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
        expectTypeOf<FormCheckboxProps>().toHaveProperty('indeterminate');
        expectTypeOf<FormRadioProps>().toHaveProperty('value');
        expectTypeOf<PropsOf<typeof FormRadioGroup>>().toHaveProperty('options');
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
        expectTypeOf<PropsOf<typeof FormDatePicker>['field']>().toEqualTypeOf<string>();
        expectTypeOf<PropsOf<typeof FormUpload>['field']>().toEqualTypeOf<string>();
        expectTypeOf<PropsOf<typeof FormUpload>['fileList']>().toEqualTypeOf<undefined>();
        expectTypeOf<PropsOf<typeof FormUpload>['defaultFileList']>().toEqualTypeOf<undefined>();
        expectTypeOf<FormCheckboxProps['field']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<FormRadioProps['field']>().toEqualTypeOf<string | undefined>();
    });

    it('FormCheckbox、FormRadio 的 change 末参 latestValues 可选：不传 field 时只有控件原始参数', () => {
        expectTypeOf<Parameters<NonNullable<FormCheckboxProps['onChange']>>[1]>().toEqualTypeOf<Record<string, any> | undefined>();
        expectTypeOf<Parameters<NonNullable<FormRadioProps['onChange']>>[1]>().toEqualTypeOf<Record<string, any> | undefined>();
        expectTypeOf<Parameters<NonNullable<FormCheckboxProps['onChange']>>['length']>().toEqualTypeOf<1 | 2>();
    });

    it('FormSelect 接受 multiple，且不接受 defaultValue', () => {
        type SelectFieldProps = PropsOf<typeof FormSelect>;
        expectTypeOf<{ field: string; multiple: true }>().toExtend<SelectFieldProps>();
        expectTypeOf<{ field: string; multiple: false }>().toExtend<SelectFieldProps>();
        expectTypeOf<SelectFieldProps['defaultValue']>().toEqualTypeOf<undefined>();
        expectTypeOf<FormSelectProps<string, true>['multiple']>().toEqualTypeOf<true | undefined>();
    });

    it('模板中 FormSelect、FormTreeSelect、FormCascader 的 change 按 multiple 推断（fixtures/field-types.vue 由 vue-tsc 检查）', () => {
        expect(FieldTypes).toBeDefined();
    });
});

describe('FormApi 路径类型', () => {
    it('嵌套对象路径被接受，拼错的路径无法通过编译', () => {
        expectTypeOf<'name'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.age'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.address.city'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.adress.city'>().not.toExtend<FieldPath<Values>>();
        expectTypeOf<'nope'>().not.toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.height'>().not.toExtend<FieldPath<Values>>();

        expectTypeOf<FieldPathValue<Values, 'profile.age'>>().toEqualTypeOf<number>();
        expectTypeOf<FieldPathValue<Values, 'profile.address.city'>>().toEqualTypeOf<string>();

        const check = (api: FormApi<Values>) => {
            api.setValue('profile.address.city', 'x');
        };
        expect(check).toBeTypeOf('function');
    });

    it('数组字段的下标路径与元素子路径被接受，拼错的路径无法通过编译', () => {
        expectTypeOf<string>().not.toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'tags'>().toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'tags[0]'>().toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'matrix[0][1]'>().toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'users[1].name'>().toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'users[0].roles[2].id'>().toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'tagz[0]'>().not.toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'users[0].nmae'>().not.toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'users.name'>().not.toExtend<FieldPath<ArrayValues>>();
        expectTypeOf<'users[0].roles[0].key'>().not.toExtend<FieldPath<ArrayValues>>();

        expectTypeOf<FieldPathValue<ArrayValues, 'tags[0]'>>().toEqualTypeOf<string>();
        expectTypeOf<FieldPathValue<ArrayValues, 'matrix[0][1]'>>().toEqualTypeOf<number>();
        expectTypeOf<FieldPathValue<ArrayValues, 'users[0].roles'>>().toEqualTypeOf<{ id: number }[]>();
        expectTypeOf<FieldPathValue<ArrayValues, 'users[0].roles[2].id'>>().toEqualTypeOf<number>();

        const check = (api: FormApi<ArrayValues>) => {
            api.setValue('users[0].roles[1].id', 1);
            expectTypeOf(api.getValue('users[0].name')).toEqualTypeOf<string>();
        };
        expect(check).toBeTypeOf('function');
    });

    it('递归的值类型按深度上限展开路径', () => {
        expectTypeOf<'children[0].children[1].label'>().toExtend<FieldPath<TreeNode>>();
        expectTypeOf<FieldPathValue<TreeNode, 'children[0].label'>>().toEqualTypeOf<string>();
    });

    it('按路径操作的方法都接受嵌套与数组路径，拼错的路径无法通过编译', () => {
        const check = (api: FormApi<ArrayValues>) => {
            api.setError('users[0].name', 'bad');
            api.setTouched('tags[0]', true);
            api.getFieldExist('matrix[0][1]');
            api.scrollToField('users[1].name');
            expectTypeOf(api.validate(['users[0].name'])).toEqualTypeOf<Promise<ArrayValues>>();
            // @ts-expect-error a misspelled path
            api.setTouched('tagz[0]', true);
        };
        expect(check).toBeTypeOf('function');
    });
});

describe('表单状态与校验结果类型', () => {
    type Errors = NonNullable<FormState<ArrayValues>['errors']>;
    type Touched = NonNullable<FormState<ArrayValues>['touched']>;

    it('errors、touched 按值的嵌套结构，叶子是消息数组，整体作为字段的对象或数组也可以有自己的一项', () => {
        expectTypeOf<{ tags: [undefined, string[]]; matrix: [[string[]]]; users: [{ name: string[]; roles: [undefined, { id: string[] }] }] }>().toExtend<Errors>();
        expectTypeOf<{ tags: string[]; users: [{ roles: string[] }] }>().toExtend<Errors>();
        expectTypeOf<{ tags: [undefined, string] }>().not.toExtend<Errors>();
        expectTypeOf<{ users: { name: string[] } }>().not.toExtend<Errors>();
        expectTypeOf<{ users: [{ name: true }]; tags: [true] }>().toExtend<Touched>();
        expectTypeOf<{ users: [{ name: string }] }>().not.toExtend<Touched>();
        expectTypeOf<{ profile: { address: { city: string[] } } }>().toExtend<NonNullable<FormState<Values>['errors']>>();
        expectTypeOf<{ children: [{ children: [{ label: string[] }] }] }>().toExtend<NonNullable<FormState<TreeNode>['errors']>>();
    });

    it('表单级 validator 返回嵌套的错误，叶子是消息或消息数组', () => {
        type Result = Awaited<ReturnType<NonNullable<FormProps<ArrayValues>['validator']>>>;
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<Result>();
        expectTypeOf<{ users: [{ name: string[] }] }>().toExtend<Result>();
        expectTypeOf<undefined>().toExtend<Result>();
        expectTypeOf<'form invalid'>().not.toExtend<Result>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Result>();
    });

    it('getError 返回消息数组，getTouched 与 setTouched 同形', () => {
        const check = (api: FormApi<ArrayValues>) => {
            expectTypeOf(api.getError('tags[0]')).toEqualTypeOf<string[] | undefined>();
            expectTypeOf(api.getTouched()).toEqualTypeOf<boolean | Record<string, any> | undefined>();
            api.setError('tags[0]', ['a', 'b']);
            api.setError('users', { 0: { name: 'bad' } });
        };
        expect(check).toBeTypeOf('function');
    });

    it('Values 与 Output 分离：submit 与不带字段的 validate 得到 schema 的输出', () => {
        const schema = z.object({ age: z.string().transform(Number) });
        type Output = z.output<typeof schema>;
        type Input = z.input<typeof schema>;
        const inferApi = <Values extends Record<string, any>, Output>(_props: FormProps<Values, Output>) => ({}) as FormApi<Values, Output>;
        const check = () => {
            const api = inferApi({ schema });
            expectTypeOf(api.validate()).toEqualTypeOf<Promise<Output>>();
            expectTypeOf(api.validate(['age'])).toEqualTypeOf<Promise<Input>>();
            expectTypeOf(api.getValue('age')).toEqualTypeOf<string>();
        };
        expect(check).toBeTypeOf('function');
        expectTypeOf<FormEmits<Input, Output>['submit'][0]>().toEqualTypeOf<{ age: number }>();
    });

    it('schema 与 Form 的 validator 互斥，Values 从 schema 推断', () => {
        type Props = FormProps<{ name: string }>;
        const schema = z.object({ name: z.string() });
        const validator = () => undefined;
        const inferValues = <Values extends Record<string, any>>(_props: FormProps<Values>) => ({}) as Values;
        expectTypeOf({ schema }).toExtend<Props>();
        expectTypeOf({ validator }).toExtend<Props>();
        expectTypeOf({ schema, validator }).not.toExtend<Props>();
        expectTypeOf(inferValues({ schema })).toEqualTypeOf<{ name: string }>();
    });

    it('有 schema 时 initValues 可以只给一部分，没有 schema 时 Values 从 initValues 推断', () => {
        const schema = z.object({ name: z.string(), profile: z.object({ age: z.number(), city: z.string() }) });
        const inferValues = <Values extends Record<string, any>>(_props: FormProps<Values>) => ({}) as Values;
        expectTypeOf(inferValues({ schema, initValues: { profile: { age: 1 } } })).toEqualTypeOf<z.input<typeof schema>>();
        // @ts-expect-error initValues still follow the schema's value types
        inferValues({ schema, initValues: { profile: { age: '1' } } });
        expectTypeOf(inferValues({ initValues: { name: 'a', profile: { age: 1 } } })).toEqualTypeOf<{ name: string; profile: { age: number } }>();
    });

    it('schema 的输出要与 values 一致', () => {
        type Schema = NonNullable<FormProps<{ name: string }>['schema']>;
        const valid = z.object({ name: z.string() });
        const invalid = z.object({ name: z.number() });
        expectTypeOf(valid).toExtend<Schema>();
        expectTypeOf(invalid).not.toExtend<Schema>();
    });

    it('errorChange 的 errors 与 formState.errors 同形，submitFail 的 errors 是错误树', () => {
        expectTypeOf<FormEmits<ArrayValues>['errorChange'][0]>().toEqualTypeOf<Errors>();
        type SubmitErrors = FormEmits<ArrayValues>['submitFail'][0];
        expectTypeOf<{ users: [{ name: string[] }] }>().toExtend<SubmitErrors>();
        expectTypeOf<{ users: [{ name: string }] }>().not.toExtend<SubmitErrors>();
        expectTypeOf<{ users: { name: string[] } }>().not.toExtend<SubmitErrors>();
    });
});

describe('字段校验类型', () => {
    it('rules 与 validator 互斥，validator 接受函数或 Standard Schema', () => {
        const rules = [{ required: true }];
        const validator = () => 'bad';
        expectTypeOf({ field: 'a', rules }).toExtend<InputFieldProps>();
        expectTypeOf({ field: 'a', validator }).toExtend<InputFieldProps>();
        expectTypeOf({ field: 'a', validator: z.string().min(3) }).toExtend<InputFieldProps>();
        expectTypeOf({ field: 'a', rules, validator }).not.toExtend<InputFieldProps>();
        expectTypeOf({ field: 'a', rules, validator }).not.toExtend<FormCheckboxProps>();
        expectTypeOf({ field: 'a', validator: () => 1 }).not.toExtend<InputFieldProps>();
    });

    it('RuleItem 是 Semi 自己的规则：type 只接受内置类型，validator 收到值与全部值', () => {
        expectTypeOf<{ type: 'email'; message: string }>().toExtend<RuleItem>();
        expectTypeOf<{ type: 'hex' }>().not.toExtend<RuleItem>();
        expectTypeOf<Parameters<NonNullable<RuleItem['validator']>>>().toEqualTypeOf<[value: any, values: Record<string, any>]>();
    });
});
