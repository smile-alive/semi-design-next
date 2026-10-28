import { describe, expect, it } from 'vite-plus/test';
import { isUnfinishedMessageStatus } from '../constants';

describe('isUnfinishedMessageStatus', () => {
    it.each([
        ['loading', true],
        ['incomplete', true],
        ['complete', false],
        ['error', false],
        [undefined, false],
    ])('%s 为 %s', (status, unfinished) => {
        expect(isUnfinishedMessageStatus(status)).toBe(unfinished);
    });
});
