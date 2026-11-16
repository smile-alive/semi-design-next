import { parseThemeTokens } from '#/lib/theme-tokens';

const files = import.meta.glob('../../../../packages/shared/semi-foundation/src/theme/{_palette,global,variables,animation}.scss', {
    query: '?raw',
    import: 'default',
    eager: true,
});

export const { global, palette, normal, animation } = parseThemeTokens((name) => {
    const entry = Object.entries(files).find(([file]) => file.endsWith(`/${name}`));
    if (!entry) {
        throw new Error(`theme-tokens: packages/shared/semi-foundation/src/theme/${name} not found`);
    }
    return entry[1];
});

const resolveVars = (tokens, known = {}) => {
    const map = { ...known };
    for (const { key, value } of tokens) {
        map[key] = value.replace(/var\((--[\w-]+)\)/g, (match, name) => map[name] ?? match);
    }
    return map;
};

const paletteMaps = { light: resolveVars(palette.light), dark: resolveVars(palette.dark) };

// Excludes the --semi-ai-general-<n>-<stop> gradient stops
export const paletteColors = Object.fromEntries(['light', 'dark'].map((mode) => [mode, Object.fromEntries(Object.entries(paletteMaps[mode]).filter(([key]) => !/-\d-\d$/.test(key)))]));

// chroma-js does not parse color-mix(in srgb, <palette color> a%, transparent), so expand to rgba()
const toRgba = (value) =>
    value.replace(/color-mix\(in srgb, #(\w+) ([\d.]+)%, transparent\)/g, (_match, hex, percent) => {
        const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
        const [r, g, b] = full.match(/../g).map((part) => parseInt(part, 16));
        return `rgba(${r}, ${g}, ${b}, ${Number(percent) / 100})`;
    });

export const functionalColors = Object.fromEntries(
    ['light', 'dark'].map((mode) => {
        const resolved = resolveVars(global[mode], paletteMaps[mode]);
        return [
            mode,
            Object.fromEntries(
                Object.entries(resolved)
                    .filter(([key]) => key.startsWith('--semi-color'))
                    .map(([key, value]) => [key, toRgba(value)])
            ),
        ];
    })
);
