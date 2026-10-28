import { frameworks } from '../src/lib/frameworks.ts';

function reactKey(key: string) {
    const framework = frameworks.find((item) => item !== 'react' && key.includes(`/${item}/`));
    return framework && key.replace(`/${framework}/`, '/react/');
}

export function knownRules(key: string, baseline: Record<string, string[]>) {
    const fallback = reactKey(key);
    return baseline[key] ?? (fallback ? baseline[fallback] : undefined) ?? [];
}

export function additionsOverReact(next: Record<string, string[]>) {
    return Object.entries(next).flatMap(([key, rules]) => {
        const fallback = reactKey(key);
        if (!fallback) return [];
        const reactRules = next[fallback] ?? [];
        return rules.filter((rule) => !reactRules.includes(rule)).map((rule) => ({ demo: key, rule }));
    });
}
