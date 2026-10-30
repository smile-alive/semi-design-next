import type { Component, ComponentProps } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { FieldPath, FieldPathValue, FormState } from '@fibrae/semi-foundation/form/interface';
import {
    FormInput,
    type FormAutoComplete,
    type FormCascader,
    type FormCheckbox,
    type FormCheckboxGroup,
    type FormDatePicker,
    type FormInputNumber,
    type FormPinCode,
    type FormRadio,
    type FormRadioGroup,
    type FormRating,
    type FormSelect,
    type FormSlider,
    type FormSwitch,
    type FormTagInput,
    type FormTextArea,
    type FormTimePicker,
    type FormTransfer,
    type FormTreeSelect,
    type FormUpload,
    type ArrayFieldProps,
    type CommonFieldProps,
    type FieldProps,
    type FormApi,
    type FormFieldProps,
    type FormInputGroupProps,
    type FormProps,
    type useForm,
} from '..';
import type { CheckboxProps } from '../../checkbox/interface';
import type { DatePickerProps } from '../../date-picker/interface';
import type { RadioProps } from '../../radio/interface';
import type { SelectProps } from '../../select/interface';

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

// The assertions are checked by svelte-check; the runtime body only keeps the file a valid test.
describe('Svelte Form 类型', () => {
    it('Form 的 form 取 useForm 返回的 formApi', () => {
        expectTypeOf<FormProps<Values>['form']>().not.toBeAny();
        expectTypeOf<ReturnType<typeof useForm<Values>>['formApi']>().toExtend<FormProps<Values>['form']>();
        expectTypeOf<{ getValue: () => string }>().not.toExtend<FormProps<Values>['form']>();
    });

    it('ArrayField 的 field 必填，FormInputGroup 的 label 接受文本与配置对象', () => {
        expectTypeOf<{ initValue?: unknown[] }>().not.toExtend<ArrayFieldProps>();
        expectTypeOf<{ field: string }>().toExtend<ArrayFieldProps>();
        expectTypeOf<'Name'>().toExtend<FormInputGroupProps['label']>();
        expectTypeOf<{ text: string; required: boolean }>().toExtend<FormInputGroupProps['label']>();
    });

    it('latestValues 追加在 onChange 的末尾，其他回调保持原签名', () => {
        type Wrapped = FieldProps<{ onChange?: (value: string, event: Event) => void; onBlur?: (event: FocusEvent) => void }>;
        expectTypeOf<Parameters<NonNullable<Wrapped['onChange']>>>().toEqualTypeOf<[value: string, event: Event, latestValues: Record<string, any>]>();
        expectTypeOf<Parameters<NonNullable<Wrapped['onBlur']>>>().toEqualTypeOf<[event: FocusEvent]>();
        expect(FormInput).toBeTypeOf('function');
    });
});

describe('Svelte Field Props 类型', () => {
    it('FormField 的 Props 从被包装组件推断，不接受值属性', () => {
        type Custom = Component<{ size: 'small' | 'large'; value?: string; checked?: boolean; fileList?: unknown[]; onChange?: (value: string) => void }>;
        type CustomFieldProps = FormFieldProps<Custom>;
        expectTypeOf<CustomFieldProps>().not.toBeAny();
        expectTypeOf<CustomFieldProps['size']>().toEqualTypeOf<'small' | 'large'>();
        expectTypeOf<CustomFieldProps['field']>().toEqualTypeOf<string>();
        expectTypeOf<CustomFieldProps['component']>().toEqualTypeOf<Custom>();
        expectTypeOf<CustomFieldProps>().not.toHaveProperty('value');
        expectTypeOf<CustomFieldProps>().not.toHaveProperty('checked');
        expectTypeOf<CustomFieldProps>().not.toHaveProperty('fileList');
        expectTypeOf<CustomFieldProps>().not.toHaveProperty('defaultValue');
        expectTypeOf<ComponentProps<typeof FormInput>>().not.toHaveProperty('value');
    });

    it('fieldOptions.valueKey 只接受 value、checked、fileList', () => {
        type ValueKey = NonNullable<NonNullable<FormFieldProps<Component<{ value?: string }>>['fieldOptions']>['valueKey']>;
        expectTypeOf<ValueKey>().toEqualTypeOf<'value' | 'checked' | 'fileList'>();
        expectTypeOf<'selected'>().not.toExtend<ValueKey>();
    });

    it('trigger 只接受校验时机及其数组', () => {
        expectTypeOf<['blur', 'change']>().toExtend<CommonFieldProps['trigger']>();
        expectTypeOf<'mount'>().toExtend<CommonFieldProps['trigger']>();
        expectTypeOf<'focus'>().not.toExtend<CommonFieldProps['trigger']>();
        expectTypeOf<['blur', 'focus']>().not.toExtend<CommonFieldProps['trigger']>();
    });

    it('字段公共 Props 声明 emptyValue', () => {
        expectTypeOf<CommonFieldProps>().toHaveProperty('emptyValue').toEqualTypeOf<unknown>();
        expectTypeOf<ComponentProps<typeof FormInput>>().toHaveProperty('emptyValue').toEqualTypeOf<unknown>();
    });

    it('各字段组件的 Props 仍可推断', () => {
        expectTypeOf<ComponentProps<typeof FormInput>>().toHaveProperty('placeholder');
        expectTypeOf<ComponentProps<typeof FormInputNumber>>().toHaveProperty('step');
        expectTypeOf<ComponentProps<typeof FormTextArea>>().toHaveProperty('rows');
        expectTypeOf<ComponentProps<typeof FormCheckboxGroup>>().toHaveProperty('options');
        expectTypeOf<ComponentProps<typeof FormCheckbox>>().toHaveProperty('indeterminate');
        expectTypeOf<ComponentProps<typeof FormRadio>>().toHaveProperty('value');
        expectTypeOf<ComponentProps<typeof FormRadioGroup>>().toHaveProperty('options');
        expectTypeOf<ComponentProps<typeof FormDatePicker>>().toHaveProperty('type');
        expectTypeOf<ComponentProps<typeof FormSwitch>>().toHaveProperty('size');
        expectTypeOf<ComponentProps<typeof FormSlider>>().toHaveProperty('max');
        expectTypeOf<ComponentProps<typeof FormTimePicker>>().toHaveProperty('format');
        expectTypeOf<ComponentProps<typeof FormTreeSelect>>().toHaveProperty('treeData');
        expectTypeOf<ComponentProps<typeof FormCascader>>().toHaveProperty('treeData');
        expectTypeOf<ComponentProps<typeof FormTransfer>>().toHaveProperty('dataSource');
        expectTypeOf<ComponentProps<typeof FormRating>>().toHaveProperty('count');
        expectTypeOf<ComponentProps<typeof FormAutoComplete>>().toHaveProperty('data');
        expectTypeOf<ComponentProps<typeof FormUpload>>().toHaveProperty('action');
        expectTypeOf<ComponentProps<typeof FormTagInput>>().toHaveProperty('maxTagCount');
        expectTypeOf<ComponentProps<typeof FormPinCode>>().toHaveProperty('count');
        expectTypeOf<ComponentProps<typeof FormDatePicker>['field']>().toEqualTypeOf<string>();
        expectTypeOf<ComponentProps<typeof FormUpload>['field']>().toEqualTypeOf<string>();
        expectTypeOf<ComponentProps<typeof FormUpload>>().not.toHaveProperty('fileList');
        expectTypeOf<ComponentProps<typeof FormCheckbox>['field']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<ComponentProps<typeof FormRadio>['field']>().toEqualTypeOf<string | undefined>();
    });

    it('有 trigger snippet 的控件，字段以 triggerContent 接收它；trigger 保持校验时机', () => {
        expectTypeOf<ComponentProps<typeof FormSelect>['triggerContent']>().toEqualTypeOf<SelectProps['trigger']>();
        expectTypeOf<ComponentProps<typeof FormDatePicker>['triggerContent']>().toEqualTypeOf<DatePickerProps['trigger']>();
        expectTypeOf<ComponentProps<typeof FormSelect>['trigger']>().toEqualTypeOf<CommonFieldProps['trigger']>();
        expectTypeOf<ComponentProps<typeof FormInput>>().not.toHaveProperty('triggerContent');
    });

    it('FormCheckbox、FormRadio 的 onChange 保持控件自己的签名，字段值经 checked 传递', () => {
        expectTypeOf<ComponentProps<typeof FormCheckbox>['onChange']>().toEqualTypeOf<CheckboxProps['onChange']>();
        expectTypeOf<ComponentProps<typeof FormRadio>['onChange']>().toEqualTypeOf<RadioProps['onChange']>();
        expectTypeOf<ComponentProps<typeof FormCheckbox>>().not.toHaveProperty('checked');
        expectTypeOf<ComponentProps<typeof FormRadio>>().not.toHaveProperty('checked');
    });

    it('FormSelect 接受 multiple，且不接受 value 与 defaultValue', () => {
        type SelectFieldProps = ComponentProps<typeof FormSelect>;
        expectTypeOf<{ field: string; multiple: true }>().toExtend<SelectFieldProps>();
        expectTypeOf<{ field: string; multiple: false }>().toExtend<SelectFieldProps>();
        expectTypeOf<SelectFieldProps>().not.toHaveProperty('defaultValue');
        expectTypeOf<SelectFieldProps>().not.toHaveProperty('value');
    });
});

describe('Svelte FormApi 路径类型', () => {
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

describe('Svelte 表单状态与校验结果类型', () => {
    type Errors = NonNullable<FormState<ArrayValues>['errors']>;
    type Touched = NonNullable<FormState<ArrayValues>['touched']>;

    it('errors、touched 按值的嵌套结构，整体作为字段的对象或数组也可以有自己的一项', () => {
        expectTypeOf<{ tags: [undefined, string]; matrix: [[string]]; users: [{ name: string; roles: [undefined, { id: string }] }] }>().toExtend<Errors>();
        expectTypeOf<{ tags: string; users: [{ roles: string }] }>().toExtend<Errors>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Errors>();
        expectTypeOf<{ users: [{ name: true }]; tags: [true] }>().toExtend<Touched>();
        expectTypeOf<{ users: [{ name: string }] }>().not.toExtend<Touched>();
        expectTypeOf<{ profile: { address: { city: string } } }>().toExtend<NonNullable<FormState<Values>['errors']>>();
        expectTypeOf<{ children: [{ children: [{ label: string }] }] }>().toExtend<NonNullable<FormState<TreeNode>['errors']>>();
    });

    it('表单级 validator 返回嵌套的错误', () => {
        type Result = Awaited<ReturnType<NonNullable<FormProps<ArrayValues>['validator']>>>;
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<Result>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Result>();
    });

    it('onErrorChange 的 errors 与 formState.errors 同形，onSubmitFail 的 errors 是校验结果', () => {
        expectTypeOf<Parameters<NonNullable<FormProps<ArrayValues>['onErrorChange']>>[0]>().toEqualTypeOf<Errors>();
        type SubmitErrors = Parameters<NonNullable<FormProps<ArrayValues>['onSubmitFail']>>[0];
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<SubmitErrors>();
        expectTypeOf<'form invalid'>().toExtend<SubmitErrors>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<SubmitErrors>();
    });
});
