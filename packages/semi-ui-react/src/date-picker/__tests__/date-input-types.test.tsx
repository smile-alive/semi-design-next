import type React from 'react';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { DateInputFoundationProps } from '@fibrae/semi-foundation/date-picker/input-foundation';
import type { DateInputProps } from '../index';

// The assertions are checked by typecheck; the runtime body only keeps the file a valid test.
describe('DateInput 属性类型', () => {
    it('DateInputProps 与 foundation 属性没有索引签名，清除回调只有 onRangeClear 一个名字', () => {
        expectTypeOf<string extends keyof DateInputProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<string extends keyof DateInputFoundationProps ? true : false>().toEqualTypeOf<false>();
        expectTypeOf<DateInputProps>().toHaveProperty('onRangeClear');
        expectTypeOf<DateInputFoundationProps>().toHaveProperty('onRangeClear');
        expectTypeOf<DateInputFoundationProps>().not.toHaveProperty('onRangeInputClear');
        expectTypeOf<DateInputProps>().not.toHaveProperty('onRangeBlur');
        expect(true).toBe(true);
    });

    it('onBlur 收到 FocusEvent，onFocus 收到 FocusEvent 或 MouseEvent', () => {
        type FocusEvt = React.FocusEvent<HTMLDivElement>;
        type MouseEvt = React.MouseEvent<HTMLElement>;
        expectTypeOf<Parameters<NonNullable<DateInputProps['onBlur']>>[0]>().toEqualTypeOf<FocusEvt>();
        expectTypeOf<Parameters<NonNullable<DateInputProps['onFocus']>>[0]>().toEqualTypeOf<FocusEvt | MouseEvt>();
        expectTypeOf<Parameters<NonNullable<DateInputProps['onFocus']>>[1]>().toEqualTypeOf<'rangeStart' | 'rangeEnd' | undefined>();
        expect(true).toBe(true);
    });
});
