/** @jsxImportSource vue */
import { describe, it } from 'vite-plus/test';
import { expectCleanHydration } from '@test/utils/vue.ssr';
import { ssrCases } from './ssr-cases';

describe('服务端 HTML 注水无不匹配', () => {
    for (const item of ssrCases) {
        it(`${item.name}`, () => expectCleanHydration(item));
    }
});
