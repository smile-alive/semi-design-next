import { describe, expect, it } from 'vite-plus/test';
import * as core from '../src';
import { getFillColor, IconActivity, IconAILoading, resolveValue, type IconData, type IconNode } from '../src';
import * as illustrations from '../src/illustrations';
import * as lab from '../src/lab';
import { IconAvatar } from '../src/lab';

describe('semi-icons-core', () => {
    it('单色图标：DOM 属性名，颜色跟随 currentColor，没有 fills', () => {
        expect(IconActivity.name).toBe('activity');
        expect(IconActivity.attrs).toEqual({ viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' });
        expect(IconActivity.fills).toBeUndefined();
        const [[tag, attrs, children]] = IconActivity.children;
        expect(tag).toBe('path');
        expect(attrs).toMatchObject({ 'fill-rule': 'evenodd', 'clip-rule': 'evenodd', fill: 'currentColor' });
        expect(children).toBeUndefined();
    });

    it('彩色图标保留原色与 style 字符串', () => {
        expect(IconAvatar.name).toBe('avatar');
        const mask = IconAvatar.children.find(([tag]) => tag === 'mask');
        expect(mask?.[1].style).toBe('mask-type:alpha');
        expect(IconAvatar.children[0][1].fill).toBe('#FBCD2C');
    });

    it('多色图标的占位符由 fill 颜色和实例 id 填充', () => {
        expect(IconAILoading.fills).toBe(4);
        const [path, [, , [gradient]]] = IconAILoading.children;
        const colors = getFillColor(undefined, 4);
        expect(resolveValue(path[1].stroke, colors, 'x')).toBe('url(#x__semi-ai-loading)');
        expect(resolveValue(gradient[1].id, colors, 'x')).toBe('x__semi-ai-loading');
        expect(gradient[2]?.map(([, attrs]) => resolveValue(attrs['stop-color'], colors, 'x'))).toEqual(colors);
    });

    it('插画保留原色与默认宽高', () => {
        expect(illustrations.IllustrationFailure.name).toBe('failure');
        expect(illustrations.IllustrationFailure.attrs).toMatchObject({ width: '200', height: '200', viewBox: '0 0 200 200' });
        expect(illustrations.IllustrationFailure.fills).toBeUndefined();
        expect(JSON.stringify(illustrations.IllustrationFailure.children)).toContain('var(--semi-color-');
    });

    it('每个 id 都带实例 id 占位，url() 与 href 只引用同一图标里的 id', () => {
        const icons = [...Object.values(core), ...Object.values(lab), ...Object.values(illustrations)].filter((value): value is IconData => typeof value === 'object' && 'children' in value);
        let withIds = 0;
        const unprefixed: string[] = [];
        const dangling: string[] = [];
        for (const icon of icons) {
            const ids: string[] = [];
            const refs: string[] = [];
            const visit = ([, attrs, children = []]: IconNode) => {
                for (const [name, value] of Object.entries(attrs)) {
                    if (name === 'id') ids.push(value);
                    else if (/(^|:)href$/.test(name)) refs.push(value.slice(1));
                    else refs.push(...[...value.matchAll(/url\(#([^)]+)\)/g)].map(([, ref]) => ref));
                }
                children.forEach(visit);
            };
            icon.children.forEach(visit);
            if (ids.length) withIds++;
            unprefixed.push(...ids.filter((id) => !id.startsWith('{uid}')).map((id) => `${icon.name}: ${id}`));
            dangling.push(...refs.filter((ref) => !ids.includes(ref)).map((ref) => `${icon.name}: ${ref}`));
        }
        expect(withIds).toBeGreaterThan(0);
        expect(unprefixed).toEqual([]);
        expect(dangling).toEqual([]);
    });
});
