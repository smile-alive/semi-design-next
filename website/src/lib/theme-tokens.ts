import { scssStatements } from './scss.ts';

export interface ThemeToken {
    key: string;
    value: string;
    comment?: string;
}

const isComment = (line: string) => line.startsWith('//') || line.startsWith('/*');
const isSelector = (line: string) => line.endsWith('{');
const isDeclaration = (line: string) => line && !isComment(line) && !line.startsWith('}') && !line.startsWith('@') && !isSelector(line);

function splitLine(line: string): ThemeToken {
    const [key, value, comment] = line
        .split(/:|\/\/|\/\*/)
        .map((part) => part.trim())
        .filter(Boolean);
    return { key, value: value?.replace(/;+$/, '') ?? '', comment: comment?.replace('ignore-semi-css-trans', '') };
}

/** `read` returns the raw source of a file in semi-foundation/src/theme; the site reads it through Vite, scripts through fs */
export function parseThemeTokens(read: (name: string) => string) {
    const readLines = (name: string) => scssStatements(read(name));
    // Blocks selecting only always-dark are dark, only always-light are light; both or neither (shared formulas, mode-free
    // :root blocks) belong to both modes (source spells it .#{$prefix}-always-dark)
    const lightAndDark = (name: string) => {
        const tokens: Record<'light' | 'dark', ThemeToken[]> = { light: [], dark: [] };
        let modes: ('light' | 'dark')[] = [];
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
    return {
        global: lightAndDark('global.scss'),
        palette: lightAndDark('_palette.scss'),
        normal: readLines('variables.scss')
            .filter((line) => line && !isComment(line))
            .map(splitLine),
        animation: readLines('animation.scss').filter(isDeclaration).map(splitLine),
    };
}
