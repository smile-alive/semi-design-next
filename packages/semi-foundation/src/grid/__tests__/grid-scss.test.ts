import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { beforeAll, describe, expect, it } from 'vite-plus/test';

const foundation = path.resolve(import.meta.dirname, '../..');

// Only semi:theme needs resolving; this is enough to compile grid.scss on its own
function compileGrid() {
    return sass.compile(path.join(foundation, 'grid/grid.scss'), {
        importers: [
            {
                findFileUrl: (url) => (url === 'semi:theme' ? pathToFileURL(path.join(foundation, 'theme/index.scss')) : null),
            },
        ],
        quietDeps: true,
    }).css;
}

describe('grid.scss 断点 0 的隐藏规则', () => {
    let css = '';
    beforeAll(() => {
        css = compileGrid();
    });

    const mediaBlock = (min: number) => {
        const start = css.indexOf(`@media (min-width: ${min}px)`);
        const next = css.indexOf('@media', start + 1);
        return css.slice(start, next === -1 ? undefined : next);
    };

    it.each([
        ['sm', 576],
        ['md', 768],
        ['lg', 992],
        ['xl', 1200],
        ['xxl', 1600],
    ])('%s 的 0 只写在自己的媒体查询内，且排在同断点 display:block 之后', (bp, min) => {
        const hidden = new RegExp(`\\.semi-col-${bp}-0\\b[^{}]*\\{\\s*display:\\s*none`);
        const firstMedia = css.indexOf('@media');
        expect(css.slice(0, firstMedia)).not.toMatch(hidden);
        const block = mediaBlock(min);
        const hiddenAt = block.search(hidden);
        expect(hiddenAt).toBeGreaterThan(-1);
        expect(hiddenAt).toBeGreaterThan(block.indexOf(`.semi-col-${bp}-24 {`));
    });

    it('xs 是基础层，0 排在 xs 的 display:block 之后', () => {
        const hiddenAt = css.search(/\.semi-col-xs-0\b[^{}]*\{\s*display:\s*none/);
        expect(hiddenAt).toBeGreaterThan(-1);
        expect(hiddenAt).toBeGreaterThan(css.indexOf('.semi-col-xs-24 {'));
    });

    it('不带断点的 col-0 仍整体隐藏', () => {
        expect(css).toMatch(/\.semi-col-0\b[^{}]*\{\s*display:\s*none/);
    });
});
