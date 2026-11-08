import { describe, expect, it } from 'vite-plus/test';
import { getStackItemTransform } from '../constants';

describe('getStackItemTransform', () => {
    it('每层向下偏移 8px 并收窄 5%，bottom 方位向上偏移', () => {
        expect(getStackItemTransform(2, 'topRight')).toBe('translateY(16px) scaleX(0.9)');
        expect(getStackItemTransform(1, 'bottomLeft')).toBe('translateY(-8px) scaleX(0.95)');
    });
});
