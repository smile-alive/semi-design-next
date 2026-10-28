// No astro:content dependency: astro.config.ts and remark plugins load outside the content layer and need this list
export const locales = ['zh-CN', 'en-US'] as const;
export const defaultLocale = 'zh-CN';
export type Locale = (typeof locales)[number];

// Astro.currentLocale is string | undefined; narrow it here
export function asLocale(value?: string) {
    if (value && (locales as readonly string[]).includes(value)) return value as Locale;
    throw new Error(`Unexpected locale "${value ?? ''}"`);
}
