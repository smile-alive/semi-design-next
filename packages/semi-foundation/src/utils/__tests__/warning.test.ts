import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import warning, { isDev } from '../warning';

describe('warning', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('开发环境下条件成立时输出带前缀的告警，条件不成立时不输出', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        warning(false, 'skipped');
        expect(warn).not.toHaveBeenCalled();
        warning(true, 'shown');
        expect(warn).toHaveBeenCalledWith('Warning: shown');
    });

    it('NODE_ENV 为 production 时不输出', () => {
        vi.stubEnv('NODE_ENV', 'production');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(isDev()).toBe(false);
        warning(true, 'hidden');
        expect(warn).not.toHaveBeenCalled();
    });
});
