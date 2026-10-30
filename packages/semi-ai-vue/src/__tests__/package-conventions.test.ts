import { describe, expect, it } from 'vite-plus/test';
import * as exported from '@fibrae/semi-ai-vue';

function collect(value: unknown, depth: number): object[] {
    if (!value || typeof value !== 'object' || depth > 2) {
        return [];
    }
    return [value, ...Object.values(value).flatMap((child) => collect(child, depth + 1))];
}

describe('所有导出组件', () => {
    it('Boolean 有 default，Function 默认值为 undefined', () => {
        const violations: string[] = [];
        for (const component of Object.values(exported).flatMap((value) => collect(value, 0))) {
            if (!('props' in component) || !component.props || typeof component.props !== 'object') {
                continue;
            }
            for (const [key, option] of Object.entries(component.props as Record<string, { type?: unknown; default?: unknown } | null>)) {
                // `prop: null` is Vue's any-type declaration, neither Boolean nor Function
                if (option === null) {
                    continue;
                }
                const types = [option.type].flat();
                if (types.includes(Boolean) && !Object.hasOwn(option, 'default')) {
                    violations.push(`${key}: Boolean prop must declare default`);
                }
                if (types.includes(Function) && option.default !== undefined) {
                    violations.push(`${key}: Function prop must use undefined default`);
                }
            }
        }
        expect(violations).toEqual([]);
    });
});
