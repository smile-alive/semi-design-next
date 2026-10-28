import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileScript, parse } from 'vue/compiler-sfc';
import { describe, expect, it } from 'vite-plus/test';

describe('PinCode props 编译', () => {
    it('生产编译保留 format 的 RegExp 运行时类型', () => {
        const filename = join(import.meta.dirname, '../pincode.vue');
        const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
        const { content } = compileScript(descriptor, { id: 'pincode', isProd: true });
        const format = /format:\s*\{([^}]*)\}/.exec(content)?.[1] ?? '';
        expect(format).toMatch(/type:\s*\[[^\]]*Object[^\]]*\]/);
    });
});
