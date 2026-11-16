import type { ClassValue } from 'vue';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { SelectChangeValue, SelectEmits, SelectOptionItemSlotProps, SelectOptionProps, SelectProps, SelectTriggerSlotProps, SelectValue } from '..';
import Typed from './fixtures/typed.vue';

type ChangeValue<V extends string | number | boolean = string | number, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined> = SelectEmits<V, Multiple, WithObject>['change'][0];

describe('Select 类型', () => {
    it('change 与 update:modelValue 的参数随 multiple 与 changeWithObject 收窄', () => {
        expectTypeOf<ChangeValue<string>>().toEqualTypeOf<string | undefined>();
        expectTypeOf<ChangeValue<string, true>>().toEqualTypeOf<string[]>();
        expectTypeOf<ChangeValue<string, boolean>>().toEqualTypeOf<string | string[] | undefined>();
        expectTypeOf<ChangeValue<boolean>>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<ChangeValue<string, undefined, true>>().toEqualTypeOf<SelectOptionProps<string> | undefined>();
        expectTypeOf<ChangeValue<string, true, true>>().toEqualTypeOf<SelectOptionProps<string>[]>();
        expectTypeOf<ChangeValue<string, undefined, boolean>>().toEqualTypeOf<string | SelectOptionProps<string> | undefined>();
        expectTypeOf<SelectEmits<string, true>['update:modelValue'][0]>().toEqualTypeOf<string[]>();
        expectTypeOf<SelectChangeValue<number, undefined, undefined>>().toEqualTypeOf<number | undefined>();
    });

    it('select 与 deselect 的 value 是选项的原始 value，changeWithObject 时也不是对象', () => {
        expectTypeOf<SelectEmits<string, true>['select'][0]>().toEqualTypeOf<string>();
        expectTypeOf<SelectEmits<string, true>['deselect'][0]>().toEqualTypeOf<string>();
        expectTypeOf<SelectEmits<string, true, true>['select'][0]>().toEqualTypeOf<string>();
        expectTypeOf<SelectEmits<string, true, true>['deselect'][1]>().toEqualTypeOf<SelectOptionProps<string>>();
        expectTypeOf<SelectEmits<'a' | 'b'>['exceed'][0]>().toEqualTypeOf<SelectOptionProps<'a' | 'b'>>();
    });

    it('modelValue 的字面量类型放宽为基础类型', () => {
        expectTypeOf<SelectProps<string>['modelValue']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<SelectProps<'a' | 'b'>['modelValue']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<SelectProps<'a' | 'b', true>['modelValue']>().toEqualTypeOf<string[] | undefined>();
        expectTypeOf<SelectProps<true | false>['modelValue']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<SelectProps<string, undefined, true>['modelValue']>().toEqualTypeOf<SelectOptionProps<string> | undefined>();
        expectTypeOf<SelectProps['modelValue']>().toEqualTypeOf<string | number | undefined>();
        expectTypeOf<SelectValue<'a' | 'b'>>().toEqualTypeOf<string | undefined>();
        expectTypeOf<SelectProps['changeWithObject']>().toEqualTypeOf<undefined>();
    });

    it('#trigger 插槽参数没有 onChange', () => {
        expectTypeOf<SelectTriggerSlotProps>().not.toHaveProperty('onChange');
        expectTypeOf<SelectTriggerSlotProps['onSearch']>().toEqualTypeOf<(inputValue: string) => void>();
    });

    it('#optionItem 的 class 可以直接绑定到 :class', () => {
        expectTypeOf<SelectOptionItemSlotProps['class']>().toExtend<ClassValue>();
    });

    it('没有 mouseEnterDelay、mouseLeaveDelay', () => {
        expectTypeOf<SelectProps>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<SelectProps>().not.toHaveProperty('mouseLeaveDelay');
    });

    it('模板中由 v-model 与 multiple 推断 change 的参数（fixtures/typed.vue 由 vue-tsc 检查）', () => {
        expect(Typed).toBeDefined();
    });
});
