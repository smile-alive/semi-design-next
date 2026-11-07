import type { ClassValue } from 'vue';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { BasicSelectValue, SelectEmits, SelectOptionItemSlotProps, SelectProps, SelectTriggerSlotProps } from '..';
import Typed from './fixtures/typed.vue';

interface Item {
    value: string;
    label: string;
}
type ChangeValue<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> = SelectEmits<T, Multiple>['change'][0];

describe('Select 类型', () => {
    it('change 与 update:modelValue 的参数随 multiple 收窄', () => {
        expectTypeOf<ChangeValue<string>>().toEqualTypeOf<string | undefined>();
        expectTypeOf<ChangeValue<string, true>>().toEqualTypeOf<string[]>();
        expectTypeOf<ChangeValue<string, boolean>>().toEqualTypeOf<string | string[] | undefined>();
        expectTypeOf<ChangeValue<Item>>().toEqualTypeOf<Item | undefined>();
        expectTypeOf<ChangeValue<Item, true>>().toEqualTypeOf<Item[]>();
        expectTypeOf<SelectEmits<string, true>['update:modelValue'][0]>().toEqualTypeOf<string[]>();
    });

    it('select 与 deselect 的 value 是选项的原始 value，changeWithObject 时也不是对象', () => {
        expectTypeOf<SelectEmits<string, true>['select'][0]>().toEqualTypeOf<string | number>();
        expectTypeOf<SelectEmits<string, true>['deselect'][0]>().toEqualTypeOf<string | number>();
        expectTypeOf<SelectEmits<Item, true>['select'][0]>().toEqualTypeOf<string | number>();
        expectTypeOf<SelectEmits<Item, true>['deselect'][0]>().toEqualTypeOf<string | number>();
        expectTypeOf<SelectEmits<Item>['select'][0]>().not.toExtend<Item>();
    });

    it('modelValue 随泛型参数收窄', () => {
        expectTypeOf<SelectProps<string>['modelValue']>().toEqualTypeOf<string | string[] | undefined>();
        expectTypeOf<SelectProps['modelValue']>().toEqualTypeOf<BasicSelectValue | any[] | undefined>();
        expectTypeOf<SelectProps['changeWithObject']>().toEqualTypeOf<boolean | undefined>();
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
