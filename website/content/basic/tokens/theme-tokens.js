import { scssStatements } from '#/lib/scss';

const files = import.meta.glob('../../../../packages/semi-foundation/src/theme/{_palette,global,variables,animation}.scss', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const readLines = (name) => {
    const entry = Object.entries(files).find(([file]) => file.endsWith(`/${name}`));
    if (!entry) {
        throw new Error(`theme-tokens: packages/semi-foundation/src/theme/${name} not found`);
    }
    return scssStatements(entry[1]);
};

const isComment = (line) => line.startsWith('//') || line.startsWith('/*');
const isSelector = (line) => line.endsWith('{');
const isDeclaration = (line) => line && !isComment(line) && !line.startsWith('}') && !line.startsWith('@') && !isSelector(line);

const splitLine = (line) => {
    const [key, value, comment] = line
        .split(/:|\/\/|\/\*/)
        .map((part) => part.trim())
        .filter(Boolean);
    return { key, value: value?.replace(/;+$/, ''), comment: comment?.replace('ignore-semi-css-trans', '') };
};

// Blocks selecting only always-dark are dark, only always-light are light; both or neither (shared formulas, mode-free
// :root blocks) belong to both modes (source spells it .#{$prefix}-always-dark)
const lightAndDark = (name) => {
    const tokens = { light: [], dark: [] };
    let modes = [];
    for (const line of readLines(name).filter((text) => isDeclaration(text) || isSelector(text))) {
        if (isSelector(line)) {
            const dark = /-always-dark\b/.test(line);
            const light = /-always-light\b/.test(line);
            modes = dark === light ? ['light', 'dark'] : dark ? ['dark'] : ['light'];
            continue;
        }
        const token = splitLine(line);
        modes.forEach((mode) => tokens[mode].push(token));
    }
    // A dark token without its own comment reuses the light one
    const lightComment = new Map(tokens.light.map((token) => [token.key, token.comment]));
    tokens.dark.forEach((token) => {
        token.comment ||= lightComment.get(token.key);
    });
    return tokens;
};

export const global = lightAndDark('global.scss');
export const palette = lightAndDark('_palette.scss');
export const normal = readLines('variables.scss')
    .filter((line) => line && !isComment(line))
    .map(splitLine);
export const animation = readLines('animation.scss').filter(isDeclaration).map(splitLine);

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

// chroma-js does not parse relative color syntax (rgb(from <palette color> r g b / a)), so expand to rgba()
const toRgba = (value) =>
    value.replace(/rgb\(from #(\w+) r g b \/ ([\d.]+)\)/g, (_match, hex, alpha) => {
        const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
        const [r, g, b] = full.match(/../g).map((part) => parseInt(part, 16));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
