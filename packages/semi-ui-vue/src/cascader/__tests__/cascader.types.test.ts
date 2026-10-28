import type { ClassValue } from 'vue';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { CascaderData, CascaderDisplaySlotProps, CascaderEmits, CascaderEntity, CascaderFilterItemSlotProps, CascaderProps, CascaderSimpleValue, CascaderSlots, CascaderTagSlotProps, CascaderTriggerSlotProps, CascaderVirtualize } from '..';
import Typed from './fixtures/typed.vue';

describe('Cascader 类型', () => {
    it('virtualizeInSearch.height 的类型只接受 number', () => {
        expectTypeOf<CascaderVirtualize['height']>().toEqualTypeOf<number | undefined>();
        expectTypeOf<NonNullable<CascaderProps['virtualizeInSearch']>>().toExtend<CascaderVirtualize>();
        expectTypeOf<{ itemSize: number; height: string }>().not.toExtend<CascaderVirtualize>();
    });

    it('focus 的载荷是打开下拉的点击或按键事件，blur 另有 undefined', () => {
        expectTypeOf<CascaderEmits['focus'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expectTypeOf<CascaderEmits['blur'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent | undefined>();
    });

    it('filterSorter 的前两个参数是两条结果路径', () => {
        type Sorter = NonNullable<CascaderProps['filterSorter']>;
        expectTypeOf<Parameters<Sorter>[0]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[1]>().toEqualTypeOf<CascaderData[]>();
        expectTypeOf<Parameters<Sorter>[2]>().toEqualTypeOf<string>();
    });

    it('checkRelation、searchPosition 只接受文档列出的字面量', () => {
        expectTypeOf<CascaderProps['checkRelation']>().toEqualTypeOf<'related' | 'unRelated' | undefined>();
        expectTypeOf<CascaderProps['searchPosition']>().toEqualTypeOf<'trigger' | 'custom' | undefined>();
        expectTypeOf<'unrelated'>().not.toExtend<NonNullable<CascaderProps['checkRelation']>>();
        expectTypeOf<'top'>().not.toExtend<NonNullable<CascaderProps['searchPosition']>>();
    });

    it('modelValue、change、select、#trigger 与 #tag 的类型随 multiple 区分', () => {
        expectTypeOf<CascaderProps['modelValue']>().toEqualTypeOf<CascaderSimpleValue | CascaderSimpleValue[] | undefined>();
        expectTypeOf<CascaderEmits['change']>().toEqualTypeOf<[value: CascaderSimpleValue[]]>();
        expectTypeOf<CascaderEmits<true>['change']>().toEqualTypeOf<[value: CascaderSimpleValue[][]]>();
        expectTypeOf<CascaderEmits<true>['update:modelValue']>().toEqualTypeOf<[value: CascaderSimpleValue[][]]>();
        expectTypeOf<CascaderEmits['select'][0]>().toEqualTypeOf<string | number>();
        expectTypeOf<CascaderTriggerSlotProps['value']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<CascaderTriggerSlotProps<true>['value']>().toEqualTypeOf<Set<string>>();
        expectTypeOf<CascaderTagSlotProps['entity']>().toEqualTypeOf<CascaderEntity>();
        expectTypeOf<CascaderSlots['tag']>().toEqualTypeOf<CascaderSlots<true>['tag']>();
    });

    it('#filterItem 的 class 可以直接绑定到 :class', () => {
        expectTypeOf<CascaderFilterItemSlotProps['class']>().toExtend<ClassValue>();
    });

    it('#trigger 的 inputValue 是字符串，参数里没有 onChange', () => {
        expectTypeOf<CascaderTriggerSlotProps['inputValue']>().toEqualTypeOf<string>();
        expectTypeOf<CascaderTriggerSlotProps>().not.toHaveProperty('onChange');
        expectTypeOf<CascaderTriggerSlotProps['onSearch']>().toEqualTypeOf<(inputValue: string) => void>();
    });

    it('#display 的 path 与 changeWithObject 的 change 同型：值不在 treeData 中时是原始值', () => {
        expectTypeOf<CascaderDisplaySlotProps['path']>().toEqualTypeOf<CascaderSimpleValue[]>();
    });

    it('不声明不生效的 mouseEnterDelay、mouseLeaveDelay', () => {
        expectTypeOf<CascaderProps>().not.toHaveProperty('mouseEnterDelay');
        expectTypeOf<CascaderProps>().not.toHaveProperty('mouseLeaveDelay');
    });

    it('模板中由 v-model 与 multiple 推断 change 的参数（fixtures/typed.vue 由 vue-tsc 检查）', () => {
        expect(Typed).toBeDefined();
    });
});
