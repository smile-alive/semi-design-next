import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { beforeAll, describe, expect, it } from 'vite-plus/test';

const foundation = path.resolve(import.meta.dirname, '../../..');

// Only semi:theme needs resolving; this is enough to compile grid.scss on its own
function compileGrid() {
    return sass.compile(path.join(foundation, 'components/grid/grid.scss'), {
        importers: [
            {
                findFileUrl: (url) => (url === 'semi:theme' ? pathToFileURL(path.join(foundation, 'theme/index.scss')) : null),
            },
        ],
        quietDeps: true,
    }).css;
}

describe('grid.scss 的 Col 规则', () => {
    let css = '';
    beforeAll(() => {
        css = compileGrid();
    });

    // the text of one breakpoint's layer: the media query for sm and up, whatever precedes the first query for xs
    const layer = (min?: number) => {
        if (min === undefined) {
            return css.slice(0, css.indexOf('@media'));
        }
        const start = css.indexOf(`@media (min-width: ${min}px)`);
        const next = css.indexOf('@media', start + 1);
        return css.slice(start, next === -1 ? undefined : next);
    };

    it('不生成按跨度编号的类名', () => {
        expect(css).not.toMatch(/\.semi-col-\d/);
        expect(css).not.toMatch(/float|clear/);
    });

    it('Row 始终是 flex', () => {
        expect(css).toMatch(/\.semi-row \{[^}]*display: flex/);
    });

    it('xs 是没有媒体查询的基础层，只回退到不带后缀的变量', () => {
        expect(layer()).toContain('width: calc(var(--semi-col-span-xs, var(--semi-col-span, auto)) / 24 * 100%)');
    });

    it.each([
        ['sm', 576, 'var(--semi-col-span-sm, var(--semi-col-span-xs, var(--semi-col-span, auto)))'],
        ['md', 768, 'var(--semi-col-span-md, var(--semi-col-span-sm, var(--semi-col-span-xs, var(--semi-col-span, auto))))'],
        ['xxl', 1600, 'var(--semi-col-span-xxl, var(--semi-col-span-xl, var(--semi-col-span-lg, var(--semi-col-span-md, var(--semi-col-span-sm, var(--semi-col-span-xs, var(--semi-col-span, auto)))))))'],
    ])('%s 在自己的媒体查询里，按回退链继承更小的断点', (_bp, min, chain) => {
        expect(layer(min)).toContain(`width: calc(${chain} / 24 * 100%)`);
    });

    it('display 变量写在同一条回退链里，缺省为 block', () => {
        expect(layer(768)).toContain('display: var(--semi-col-display-md, var(--semi-col-display-sm, var(--semi-col-display-xs, var(--semi-col-display, block))))');
    });

    it('push 与 pull 用逻辑属性，offset 用 margin-inline-start', () => {
        const base = layer();
        expect(base).toContain('inset-inline-start: calc(var(--semi-col-push-xs, var(--semi-col-push, 0)) / 24 * 100%)');
        expect(base).toContain('inset-inline-end: calc(var(--semi-col-pull-xs, var(--semi-col-pull, 0)) / 24 * 100%)');
        expect(base).toContain('margin-inline-start: calc(var(--semi-col-offset-xs, var(--semi-col-offset, 0)) / 24 * 100%)');
    });

    it('体积保持在预生成类名方案的十分之一以下', () => {
        expect(css.length).toBeLessThan(10_000);
    });
});
