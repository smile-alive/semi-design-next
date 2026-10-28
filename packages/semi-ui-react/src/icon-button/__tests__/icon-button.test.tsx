import { describe, expectTypeOf, it } from 'vite-plus/test';
import type { IconButtonProps } from '../index';

describe('IconButton', () => {
    it('不声明从不生效的 iconSize、iconStyle', () => {
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconSize');
        expectTypeOf<IconButtonProps>().not.toHaveProperty('iconStyle');
    });
});
