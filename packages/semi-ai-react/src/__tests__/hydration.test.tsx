import { describe, expect, it } from 'vite-plus/test';
import { hydrateFromServer } from '@test/utils/react';
import { ssrCases } from './ssr-cases';

describe('hydration 无告警与错误', () => {
    it.each(ssrCases.map((ssrCase) => [ssrCase.name, ssrCase] as const))('%s', async (_, { element }) => {
        const { errors } = await hydrateFromServer(element());
        expect(errors).toEqual([]);
    });
});
