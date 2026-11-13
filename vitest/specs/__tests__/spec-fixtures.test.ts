import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { frameworks } from '../../../lint/index.ts';

const root = join(import.meta.dirname, '../../..');
const specs = readdirSync(join(root, 'vitest/specs'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace(/\.ts$/, ''));

// A framework's UI package is the one named semi-ui-<framework>
const uiPackages = frameworks.flatMap((framework) => framework.packages.filter((name) => name.startsWith('semi-ui-')));

describe('共享 spec 的夹具覆盖', () => {
    it('每个框架恰有一个 UI 包，且至少有一份 spec', () => {
        expect(uiPackages).toHaveLength(frameworks.length);
        expect(specs.length).toBeGreaterThan(0);
    });

    it.each(specs)('%s 的 spec 在每个框架的 UI 包里都有 <组件>.spec.test.* 入口', (component) => {
        const missing = uiPackages.filter((name) => {
            const dir = join(root, 'packages', name, 'src/components', component, '__tests__');
            return !existsSync(dir) || !readdirSync(dir).some((file) => file.startsWith(`${component}.spec.test.`));
        });
        expect(missing).toEqual([]);
    });
});
