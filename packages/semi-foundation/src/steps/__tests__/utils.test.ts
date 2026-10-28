import { describe, expect, it } from 'vite-plus/test';
import { getStepState } from '../utils';

describe('getStepState', () => {
    it('当前步骤使用整体 status，之前为 finish，之后为 wait', () => {
        expect(getStepState(1, 1, 'process', false)).toMatchObject({ status: 'process', active: true, done: false });
        expect(getStepState(0, 1, 'process', false)).toMatchObject({ status: 'finish', active: false, done: true });
        expect(getStepState(2, 1, 'process', false)).toMatchObject({ status: 'wait', active: false, done: false });
    });

    it('步骤自带 status 时不推导 status，但仍计算 active 与 done', () => {
        expect(getStepState(0, 1, 'process', true)).toMatchObject({ status: undefined, done: true });
    });

    it('整体为 error 时，当前步骤的前一步 nextError 为 true', () => {
        expect(getStepState(0, 1, 'error', false).nextError).toBe(true);
        expect(getStepState(1, 1, 'error', false).nextError).toBe(false);
        expect(getStepState(0, 1, 'process', false).nextError).toBe(false);
    });
});
