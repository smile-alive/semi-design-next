import { describe, expect, it } from 'vite-plus/test';
import { ignoreExpectedMediaErrors } from '../media';

describe('ignoreExpectedMediaErrors', () => {
    it.each(['AbortError', 'NotAllowedError', 'InvalidStateError', 'NotSupportedError'])('忽略 %s', async (name) => {
        await expect(ignoreExpectedMediaErrors(Promise.reject(new DOMException('', name)))).resolves.toBeUndefined();
    });

    it('其余拒绝原样保留', async () => {
        const typeError = new TypeError('not a function');
        await expect(ignoreExpectedMediaErrors(Promise.reject(typeError))).rejects.toBe(typeError);
        const quota = new DOMException('', 'QuotaExceededError');
        await expect(ignoreExpectedMediaErrors(Promise.reject(quota))).rejects.toBe(quota);
    });
});
