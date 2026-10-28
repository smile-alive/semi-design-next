import type { Framework } from './frameworks';

export function frameworkHref(href: string | undefined, framework: Framework, available: readonly string[]) {
    if (!href) return href;
    const match = /^(\/(?:zh-CN|en-US)\/)react(\/[^/#?]+\/[^/#?]+)(.*)$/.exec(href);
    if (!match) return href;
    const target = `${match[1]}${framework}${match[2]}`;
    return available.includes(target) ? `${target}${match[3]}` : href;
}
