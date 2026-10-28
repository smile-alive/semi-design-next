import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import '@fibrae/semi-foundation/base/tokens.scss';

const collectNames = (rules: CSSRuleList, names: Set<string>) => {
    for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
            for (const prop of rule.style) {
                if (prop.startsWith('--semi-color-')) names.add(prop);
            }
        }
        if ('cssRules' in rule) collectNames((rule as CSSGroupingRule).cssRules, names);
    }
    return names;
};
const tokenNames = () => {
    const names = new Set<string>();
    for (const sheet of document.styleSheets) collectNames(sheet.cssRules, names);
    return [...names].sort();
};

// Chrome serializes computed colors as rgb()/rgba(), or color(srgb ...) for relative color syntax
const channels = (color: string) => {
    const numbers = color.match(/-?[\d.]+/g)?.map(Number) ?? [];
    if (color.startsWith('color(srgb')) {
        const [r, g, b, a = 1] = numbers;
        return [r, g, b].map((v) => Math.round(v * 255)).concat(Math.round(a * 100) / 100);
    }
    if (color.startsWith('rgb')) {
        const [r, g, b, a = 1] = numbers;
        return [r, g, b, Math.round(a * 100) / 100];
    }
    throw new Error(`未识别的颜色格式：${color}`);
};

const resolve = (el: Element) => {
    const raw = getComputedStyle(el).getPropertyValue('--probe').trim();
    return raw.startsWith('linear-gradient') ? getComputedStyle(el).backgroundImage : channels(getComputedStyle(el).color);
};

const snapshot = (host: Element, names: string[]) =>
    Object.fromEntries(
        names.map((name) => {
            const probe = document.createElement('span');
            probe.style.setProperty('--probe', `var(${name})`);
            probe.style.color = `var(${name})`;
            probe.style.backgroundImage = `var(${name})`;
            host.append(probe);
            const value = resolve(probe);
            probe.remove();
            return [name, value];
        })
    );

describe('主题颜色 token 的解析值', () => {
    afterEach(() => {
        document.body.removeAttribute('theme-mode');
    });

    it('四种环境下每个 --semi-color-* 的解析值', async () => {
        const names = tokenNames();
        expect(names.length).toBeGreaterThan(100);
        const { container } = render(
            <>
                <div className="semi-always-dark" />
                <div className="semi-always-light" />
                <div />
            </>
        );
        const [alwaysDark, alwaysLight, plain] = container.children;
        const light = snapshot(plain, names);
        const lightAlwaysDark = snapshot(alwaysDark, names);
        document.body.setAttribute('theme-mode', 'dark');
        await expect.poll(() => getComputedStyle(document.body).colorScheme).toBe('dark');
        const dark = snapshot(plain, names);
        const darkAlwaysLight = snapshot(alwaysLight, names);
        expect({ light, dark, lightAlwaysDark, darkAlwaysLight }).toMatchSnapshot();
    });

    // Only the root's color-scheme reaches the canvas and viewport scrollbars; `normal` keeps the page's meta choice
    it('浅色 token 迁到根元素后根元素的 color-scheme 仍为 normal', async () => {
        expect(getComputedStyle(document.documentElement).colorScheme).toBe('normal');
        document.body.setAttribute('theme-mode', 'dark');
        await expect.poll(() => getComputedStyle(document.body).colorScheme).toBe('dark');
        expect(getComputedStyle(document.documentElement).colorScheme).toBe('normal');
    });
});
