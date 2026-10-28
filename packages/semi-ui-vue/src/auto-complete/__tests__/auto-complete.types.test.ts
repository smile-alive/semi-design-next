import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { AutoCompleteDataItem, AutoCompleteEmits, AutoCompleteItemSlotProps, AutoCompleteProps, AutoCompleteTriggerSlotProps } from '..';
import Typed from './fixtures/typed.vue';

interface Person {
    value: string;
    email: string;
}

describe('AutoComplete 类型', () => {
    it('renderSelectedItem 对字符串数据收到数据项对象，对对象数据收到该对象类型', () => {
        expectTypeOf<Parameters<NonNullable<AutoCompleteProps<string>['renderSelectedItem']>>[0]>().toEqualTypeOf<AutoCompleteDataItem>();
        expectTypeOf<Parameters<NonNullable<AutoCompleteProps<Person>['renderSelectedItem']>>[0]>().toEqualTypeOf<Person>();
        expectTypeOf<ReturnType<NonNullable<AutoCompleteProps['renderSelectedItem']>>>().toEqualTypeOf<string>();
    });

    it('#item 的 item 与 data 同类型', () => {
        expectTypeOf<AutoCompleteItemSlotProps<Person>['item']>().toEqualTypeOf<Person>();
        expectTypeOf<AutoCompleteItemSlotProps<string>['item']>().toEqualTypeOf<string>();
    });

    it('select 载荷为值或数据项，modelValue 与 defaultValue 只收字符串或数字', () => {
        expectTypeOf<AutoCompleteEmits['select'][0]>().toEqualTypeOf<string | number | AutoCompleteDataItem>();
        expectTypeOf<AutoCompleteProps['modelValue']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<AutoCompleteProps<Person>['defaultValue']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<AutoCompleteProps['selectWithObject']>().toEqualTypeOf<boolean | undefined>();
    });

    it('数据项的 label 只收文本', () => {
        expectTypeOf<AutoCompleteDataItem['label']>().toEqualTypeOf<string | number | undefined>();
    });

    it('#trigger 参数用 onChange 更新输入框文本，没有 onSearch', () => {
        expectTypeOf<AutoCompleteTriggerSlotProps['onChange']>().toEqualTypeOf<(value: string) => void>();
        expectTypeOf<AutoCompleteTriggerSlotProps>().not.toHaveProperty('onSearch');
    });

    it('模板中由 data 推断 #item 与 renderSelectedItem 的参数（fixtures/typed.vue 由 vue-tsc 检查）', () => {
        expect(Typed).toBeDefined();
    });
});
