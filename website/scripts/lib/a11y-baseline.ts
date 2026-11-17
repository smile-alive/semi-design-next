import { frameworks } from '../../src/lib/frameworks.ts';

type Baseline = Record<string, string[]>;

function reactKey(key: string) {
    const framework = frameworks.find((item) => item !== 'react' && key.includes(`/${item}/`));
    return framework && key.replace(`/${framework}/`, '/react/');
}

export function knownRules(key: string, baseline: Baseline) {
    const fallback = reactKey(key);
    return baseline[key] ?? (fallback ? baseline[fallback] : undefined) ?? [];
}

export function additionsOverReact(next: Baseline) {
    return Object.entries(next).flatMap(([key, rules]) => {
        const fallback = reactKey(key);
        if (!fallback) return [];
        const reactRules = new Set(next[fallback]);
        return rules.filter((rule) => !reactRules.has(rule)).map((rule) => ({ demo: key, rule }));
    });
}
