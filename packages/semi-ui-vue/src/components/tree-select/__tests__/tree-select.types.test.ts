import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { TreeSelectEmits, TreeSelectProps, TreeSelectSelectedItemSlotProps, TreeSelectSlots, TreeSelectTriggerSlotProps, TreeSelectValue } from '..';
import type { TreeNodeData } from '../../tree';
import Typed from './fixtures/typed.vue';

type ChangeEvent = MouseEvent | KeyboardEvent | null;

describe('TreeSelect 类型', () => {
    it('focus 的载荷是焦点进入的 focusin 或重新打开的点击或按键，searchAutoFocus 时为 null；blur 不含 null', () => {
        expectTypeOf<TreeSelectEmits['focus'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent | FocusEvent | null>();
        expectTypeOf<TreeSelectEmits['blur'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent | FocusEvent>();
    });

    it('modelValue 与 change 随 multiple 区分，change 带节点与事件', () => {
        expectTypeOf<TreeSelectProps['modelValue']>().toEqualTypeOf<TreeSelectValue | undefined>();
        expectTypeOf<TreeSelectProps<string, true>['modelValue']>().toEqualTypeOf<string[] | undefined>();
        expectTypeOf<TreeSelectEmits<string>['change']>().toEqualTypeOf<[value: string | undefined, node: TreeNodeData | undefined, event: ChangeEvent]>();
        expectTypeOf<TreeSelectEmits<string, true>['change']>().toEqualTypeOf<[value: string[], node: TreeNodeData[], event: ChangeEvent]>();
        expectTypeOf<TreeSelectEmits<string, true>['update:modelValue']>().toEqualTypeOf<[value: string[]]>();
    });

    it('multiple 为 boolean 时 modelValue 两种形态都接受', () => {
        expectTypeOf<TreeSelectProps<string, boolean>['modelValue']>().toEqualTypeOf<string | string[] | undefined>();
    });

    it('#selectedItem 与 #tag 参数相同，#trigger 的 value 是选中节点', () => {
        expectTypeOf<TreeSelectSelectedItemSlotProps['index']>().toEqualTypeOf<number>();
        expectTypeOf<TreeSelectSlots['tag']>().toEqualTypeOf<TreeSelectSlots['selectedItem']>();
        expectTypeOf<TreeSelectTriggerSlotProps['value']>().toEqualTypeOf<TreeNodeData[]>();
        expectTypeOf<TreeSelectTriggerSlotProps['onSearch']>().toEqualTypeOf<(inputValue: string) => void>();
    });

    it('searchPosition 只接受 dropdown 与 trigger', () => {
        expectTypeOf<TreeSelectProps['searchPosition']>().toEqualTypeOf<'dropdown' | 'trigger' | undefined>();
        expectTypeOf<'custom'>().not.toExtend<NonNullable<TreeSelectProps['searchPosition']>>();
    });

    it('模板中由 v-model、multiple 与 changeWithObject 推断 change 的参数（fixtures/typed.vue 由 vue-tsc 检查）', () => {
        expect(Typed).toBeDefined();
    });
});
