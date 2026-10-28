import { additionsOverReact, knownRules } from '#scripts/a11y-baseline.ts';
import { describe, expect, it } from 'vite-plus/test';
import { frameworkHref } from '../framework-links';
import { availableFrameworks, validateFrameworkLocales } from '../frameworks';

describe('文档框架清单', () => {
    it('只在有该框架的 demo 时启用对应框架，无 demo 页面必须显式声明', () => {
        expect(availableFrameworks(['basic.react.tsx'], undefined, 'page')).toEqual(['react']);
        expect(availableFrameworks(['basic.react.tsx', 'basic.vue'], undefined, 'page')).toEqual(['react', 'vue']);
        expect(availableFrameworks(['basic.react.tsx', 'basic.solid.tsx'], undefined, 'page')).toEqual(['react', 'solid']);
        expect(availableFrameworks([], ['vue', 'react'], 'page')).toEqual(['react', 'vue']);
        expect(availableFrameworks([], ['solid', 'react', 'vue'], 'page')).toEqual(['react', 'vue', 'solid']);
        expect(() => availableFrameworks([], undefined, 'page')).toThrow('frameworks');
        expect(() => availableFrameworks([], ['react', 'react'], 'page')).toThrow('unique');
    });

    it('拒绝双语框架清单不一致或缺少语言页面', () => {
        const entries = new Map([
            ['basic/icon/index.zh-CN', 'react,vue'],
            ['basic/icon/index.en-US', 'react'],
        ]);
        expect(() => validateFrameworkLocales(entries, ['zh-CN', 'en-US'])).toThrow('match every locale');
        entries.set('basic/icon/index.en-US', 'react,vue');
        expect(() => validateFrameworkLocales(entries, ['zh-CN', 'en-US'])).not.toThrow();
        entries.delete('basic/icon/index.en-US');
        expect(() => validateFrameworkLocales(entries, ['zh-CN', 'en-US'])).toThrow('match every locale');
    });

    it('只改写已存在的同框架文档链接，保留查询与锚点', () => {
        const targets = ['/zh-CN/vue/basic/icon'];
        expect(frameworkHref('/zh-CN/react/basic/icon?q=1#api', 'vue', targets)).toBe('/zh-CN/vue/basic/icon?q=1#api');
        expect(frameworkHref('/zh-CN/react/basic/button', 'vue', targets)).toBe('/zh-CN/react/basic/button');
        expect(frameworkHref('https://example.com/react/basic/icon', 'vue', targets)).toBe('https://example.com/react/basic/icon');
    });
});

describe('其他框架的无障碍基线', () => {
    it('缺少独立条目时回退到同名 React 条目', () => {
        expect(knownRules('/zh-CN/vue/basic/icon#demo-basic', { '/zh-CN/react/basic/icon#demo-basic': ['color-contrast'] })).toEqual(['color-contrast']);
        expect(knownRules('/zh-CN/solid/basic/icon#demo-basic', { '/zh-CN/react/basic/icon#demo-basic': ['color-contrast'] })).toEqual(['color-contrast']);
        expect(knownRules('/zh-CN/vue/basic/icon#demo-custom', {})).toEqual([]);
    });

    it('更新时拒绝其他框架的条目超出本次 React 对应条目', () => {
        expect(
            additionsOverReact({
                '/zh-CN/react/basic/icon#demo-basic': ['color-contrast'],
                '/zh-CN/vue/basic/icon#demo-basic': ['color-contrast', 'aria-valid-attr'],
                '/zh-CN/solid/basic/icon#demo-basic': ['color-contrast', 'button-name'],
            })
        ).toEqual([
            { demo: '/zh-CN/vue/basic/icon#demo-basic', rule: 'aria-valid-attr' },
            { demo: '/zh-CN/solid/basic/icon#demo-basic', rule: 'button-name' },
        ]);
        expect(
            additionsOverReact({
                '/zh-CN/react/basic/icon#demo-basic': ['color-contrast'],
                '/zh-CN/vue/basic/icon#demo-basic': [],
            })
        ).toEqual([]);
    });
});
