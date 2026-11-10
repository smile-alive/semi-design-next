import type { Component } from 'solid-js';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import * as z from 'zod';
import type { FieldPath, FieldPathValue, FormState } from '@fibrae/semi-foundation/components/form/interface';
import {
    type ArrayFieldChildrenProps,
    type ArrayFieldProps,
    type FieldProps,
    type RuleItem,
    type SchemaFieldNode,
    type SchemaFieldProps,
    type SchemaFormProps,
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

    it('rules 与 validator 互斥，validator 接受函数或 Standard Schema，错误为字符串或字符串数组', () => {
        expectTypeOf<{ field: 'a'; rules: [{ required: true }] }>().toExtend<InputFieldProps>();
        expectTypeOf<{ field: 'a'; validator: () => string[] }>().toExtend<InputFieldProps>();
        expectTypeOf<{ field: 'a'; validator: z.ZodString }>().toExtend<InputFieldProps>();
        expectTypeOf<{ field: 'a'; rules: [{ required: true }]; validator: () => undefined }>().not.toExtend<InputFieldProps>();
        expectTypeOf<{ field: 'a'; validator: () => number }>().not.toExtend<InputFieldProps>();
        expectTypeOf<{ field: 'a'; rules: [{ type: 'email'; min: 2; message: '' }] }>().toExtend<PropsOf<typeof FormCheckbox>>();
        expectTypeOf<{ type: 'any' }>().not.toExtend<RuleItem>();
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

    it('schema 的输入要与 values 一致', () => {
        type Schema = NonNullable<FormProps<{ name: string }>['schema']>;
        const valid = z.object({ name: z.string() });
        const invalid = z.object({ name: z.number() });
        expectTypeOf(valid).toExtend<Schema>();
        expectTypeOf(invalid).not.toExtend<Schema>();
    });

    it('Values 取 schema 的输入，onSubmit 与不带字段的 validate() 取 schema 的输出', () => {
        const schema = z.object({ age: z.string().transform(Number) });
        const infer = <Values extends Record<string, any>, Output>(_props: FormProps<Values, Output>) => ({}) as { values: Values; output: Output; api: FormApi<Values, Output> };
        // type-only: the api below is a cast stub and must not be called
        const check = () => {
            const result = infer({ schema, onSubmit: (values) => expectTypeOf(values).toEqualTypeOf<{ age: number }>() });
            expectTypeOf(result.values).toEqualTypeOf<{ age: string }>();
            expectTypeOf(result.output).toEqualTypeOf<{ age: number }>();
            expectTypeOf(result.api.validate()).toEqualTypeOf<Promise<{ age: number }>>();
            expectTypeOf(result.api.validate(['age'])).toEqualTypeOf<Promise<{ age: string }>>();
            expectTypeOf(result.api.getValues()).toEqualTypeOf<{ age: string }>();
        };
        expect(check).toBeTypeOf('function');
        expectTypeOf<ReturnType<typeof useForm<{ age: string }, { age: number }>>[0]>().toEqualTypeOf<FormApi<{ age: string }, { age: number }>>();
    });

    it('表单级 validator 返回嵌套的错误，错误叶子是字符串数组', () => {
        type Result = Awaited<ReturnType<NonNullable<FormProps<ArrayValues>['validator']>>>;
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<Result>();
        expectTypeOf<{ users: [{ name: ['a', 'b'] }] }>().toExtend<Result>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Result>();
        expectTypeOf<'form invalid'>().not.toExtend<Result>();
        expectTypeOf<Parameters<NonNullable<FormProps<ArrayValues>['onErrorChange']>>[0]>().toEqualTypeOf<Errors>();
        expectTypeOf<Parameters<NonNullable<FormProps<ArrayValues>['onSubmitFail']>>[0]>().toEqualTypeOf<Partial<Errors>>();
        expectTypeOf<NonNullable<Errors['tags']>>().toExtend<string[] | Array<string[] | undefined>>();
    });

    it('getTouched 与 setTouched 的类型一致', () => {
        type Api = FormApi<Values>;
        expectTypeOf<ReturnType<Api['getTouched']>>().toEqualTypeOf<boolean | Record<string, any> | undefined>();
        expectTypeOf<ReturnType<Api['getTouched']>>().toExtend<Parameters<Api['setTouched']>[1] | undefined>();
    });

    it('ArrayField 的 field 与 children 必填，InputGroup 的 label 接受文本', () => {
        expectTypeOf<{ initValue?: unknown[] }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string; children: () => null }>().toExtend<ArrayFieldProps>();
        expectTypeOf<'Name'>().toExtend<InputGroupProps['label']>();
        expectTypeOf<{ text: string; required: boolean }>().toExtend<InputGroupProps['label']>();
    });

    it('Form 与 ArrayField 接受 keepState，Form 接受 schemaDebounce，ArrayField 的 children 参数带 move', () => {
        expectTypeOf<{ keepState: false; schemaDebounce: 300 }>().toExtend<FormProps>();
        expectTypeOf<{ field: string; keepState: false; children: () => null }>().toExtend<ArrayFieldProps>();
        expectTypeOf<ArrayFieldChildrenProps['move']>().toEqualTypeOf<(from: number, to: number) => void>();
    });
});

describe('SchemaField 与 SchemaForm Props 类型', () => {
    it('widgets 的值是字段组件，renderField 收到节点与路径', () => {
        expectTypeOf<{ widgets: { uri: typeof FormInput } }>().toExtend<SchemaFieldProps>();
        expectTypeOf<NonNullable<SchemaFieldProps['renderField']>[string]>().parameter(0).toEqualTypeOf<{ node: SchemaFieldNode; field: string }>();
        expectTypeOf<SchemaFieldProps>().toHaveProperty('field').toEqualTypeOf<string | undefined>();
    });

    it('SchemaForm 接受 Form 的属性与 jsonSchema，schema 与 validator 仍互斥，不接受 render', () => {
        expectTypeOf<{ jsonSchema: { type: 'object' }; keepState: false; labelPosition: 'left' }>().toExtend<SchemaFormProps>();
        expectTypeOf<{ schema: z.ZodString; validator: () => undefined }>().not.toExtend<SchemaFormProps>();
        expectTypeOf<'render'>().not.toExtend<keyof SchemaFormProps>();
        const infer = <Values extends Record<string, any>, Output>(_props: SchemaFormProps<Values, Output>) => ({}) as Output;
        expectTypeOf(infer({ schema: z.object({ n: z.string().transform(Number) }) })).toEqualTypeOf<{ n: number }>();
    });
});
