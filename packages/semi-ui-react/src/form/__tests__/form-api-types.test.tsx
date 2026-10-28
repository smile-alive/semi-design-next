import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { FieldPath, FieldPathValue, FormState } from '@fibrae/semi-foundation/form/interface';
import type { FormUpload } from '../field';
import type { BaseFormProps, FieldProps, FormApi, FormCheckboxProps, FormRadioProps } from '../interface';

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
describe('FormApi 路径类型', () => {
    it('嵌套对象路径被接受，拼错的路径无法通过编译', () => {
        expectTypeOf<'name'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.age'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.address.city'>().toExtend<FieldPath<Values>>();
        expectTypeOf<'profile.adress.city'>().not.toExtend<FieldPath<Values>>();

        expectTypeOf<FieldPathValue<Values, 'profile.age'>>().toEqualTypeOf<number>();
        expectTypeOf<FieldPathValue<Values, 'profile.address.city'>>().toEqualTypeOf<string>();

        const check = (api: FormApi<Values>) => {
            api.setValue('profile.address.city', 'x');
            // @ts-expect-error misspelled nested path
            api.setValue('profile.adress.city', 'x');
            // @ts-expect-error unknown field
            api.setValue('nope', 1);
            // @ts-expect-error unknown nested key
            api.getValue('profile.height');
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
            api.getError('users[0].roles[1].id');
            api.setTouched('tags[0]', true);
            api.getTouched('users[0].name');
            api.getFieldExist('matrix[0][1]');
            api.getInitValue('users[0].name');
            api.scrollToField('users[1].name');
            api.scrollToError({ field: 'users[0].name' });
            expectTypeOf(api.validate(['users[0].name'])).toEqualTypeOf<Promise<ArrayValues>>();
            void api.validate({ fields: ['tags[0]'], silent: true });
            // @ts-expect-error a misspelled path
            api.setError('user[0].name', 'bad');
        };
        expect(check).toBeTypeOf('function');
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

describe('字段 Props 不接受被值属性取代的属性', () => {
    it('FormCheckbox、FormRadio 不接受 checked、defaultChecked，FormUpload 不接受 fileList', () => {
        expectTypeOf<'checked'>().not.toExtend<keyof FormCheckboxProps>();
        expectTypeOf<'defaultChecked'>().not.toExtend<keyof FormCheckboxProps>();
        expectTypeOf<'checked'>().not.toExtend<keyof FormRadioProps>();
        expectTypeOf<'defaultChecked'>().not.toExtend<keyof FormRadioProps>();
        expectTypeOf<FormCheckboxProps>().toHaveProperty('indeterminate');
        expectTypeOf<FormRadioProps>().toHaveProperty('value');
        type UploadFieldProps = typeof FormUpload extends React.ComponentType<infer P> ? P : never;
        expectTypeOf<'fileList'>().not.toExtend<keyof UploadFieldProps>();
        expectTypeOf<UploadFieldProps>().toHaveProperty('action');
    });
});

describe('表单状态与校验结果类型', () => {
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
        type Result = Awaited<ReturnType<NonNullable<BaseFormProps<ArrayValues>['validator']>>>;
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<Result>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<Result>();
    });

    it('onErrorChange 的 errors 与 formState.errors 同形，onSubmitFail 的 errors 是校验结果', () => {
        type Props = BaseFormProps<ArrayValues>;
        expectTypeOf<Parameters<NonNullable<Props['onErrorChange']>>[0]>().toEqualTypeOf<Errors>();
        type SubmitErrors = Parameters<NonNullable<Props['onSubmitFail']>>[0];
        expectTypeOf<{ users: [{ name: string }] }>().toExtend<SubmitErrors>();
        expectTypeOf<'form invalid'>().toExtend<SubmitErrors>();
        expectTypeOf<{ users: { name: string } }>().not.toExtend<SubmitErrors>();
    });
});
