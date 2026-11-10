import { describe, expectTypeOf, it } from 'vite-plus/test';
import type { DatePickerProps } from '../interface';

type OnChange<T extends NonNullable<DatePickerProps['type']>, M extends boolean = false> = NonNullable<DatePickerProps<T, M>['onChange']>;

describe('Svelte DatePicker onChange 类型', () => {
    it('单值类型的 onChange 拿到单个日期，清空时为 undefined', () => {
        for (const type of ['date', 'dateTime', 'month', 'year'] as const) {
            expectTypeOf<OnChange<typeof type>>().toEqualTypeOf<(date: Date | undefined, dateString: string | undefined) => void>();
        }
        expectTypeOf<OnChange<'year', true>>().toEqualTypeOf<(date: Date | undefined, dateString: string | undefined) => void>();
    });

    it('范围类型与 multiple 的 onChange 拿到数组', () => {
        for (const type of ['dateRange', 'dateTimeRange', 'monthRange'] as const) {
            expectTypeOf<OnChange<typeof type>>().toEqualTypeOf<(date: Date[], dateString: string[]) => void>();
        }
        expectTypeOf<OnChange<'date', true>>().toEqualTypeOf<(date: Date[], dateString: string[]) => void>();
    });
});
