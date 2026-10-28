import { describe, expectTypeOf, it } from 'vite-plus/test';
import type { ProgressProps } from '@fibrae/semi-ui-react/progress';
import type { ScrollItemProps } from '@fibrae/semi-ui-react/scroll-list/scroll-item';
import type { Motion } from '../base';

describe('Motion 类型', () => {
    it('只是动画开关', () => {
        expectTypeOf<Motion>().toEqualTypeOf<boolean>();
        expectTypeOf<NonNullable<ProgressProps['motion']>>().toEqualTypeOf<boolean>();
        expectTypeOf<NonNullable<ScrollItemProps<{ value: number }>['motion']>>().toEqualTypeOf<boolean>();
        expectTypeOf<Record<string, never>>().not.toExtend<ProgressProps['motion']>();
        expectTypeOf<() => Record<string, never>>().not.toExtend<ProgressProps['motion']>();
        expectTypeOf<() => Record<string, never>>().not.toExtend<ScrollItemProps<{ value: number }>['motion']>();
    });
});
