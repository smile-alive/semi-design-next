import { describe, expect, it } from 'vite-plus/test';
import { adjustPosition, type AdjustPositionInput, type AdjustRect } from '../adjust-position';

const rect = (left: number, top: number, width: number, height: number): AdjustRect => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
});

// Fixed order of the 12 placements, the expectation tables follow it
const POSITIONS = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight', 'left', 'leftTop', 'leftBottom', 'right', 'rightTop', 'rightBottom'];

const run = (position: string, triggerRect: AdjustRect, overrides: Partial<AdjustPositionInput> = {}) =>
    adjustPosition({
        position,
        triggerRect,
        wrapperRect: { width: 100, height: 50 },
        containerRect: { left: 0, top: 0, right: 400, bottom: 300 },
        viewport: { width: 400, height: 300 },
        spacing: 8,
        margin: 0,
        ...overrides,
    });

describe('adjustPosition: 12 个方位在各个溢出组合下的翻转', () => {
    // Viewport 400×300, popup 100×50, spacing 8, margin 0, container equals viewport, trigger 20×20.
    // Vertical need is 50 + 8 = 58, horizontal need is 100 + 8 = 108.
    // Rules:
    // 1. top family: flips to bottom when space above < 58 and below > 58; bottom family is symmetric.
    // 2. left/right family: flips to right when space left < 108 and right > 108; right family is symmetric.
    // 3. Base top/bottom expand toward the nearer edge when the trigger center is closer than half the popup width
    //    to a viewport side (top -> topLeft/topRight); left/right expand vertically likewise (left -> leftTop/leftBottom).
    // 4. topLeft/topRight etc. realign to the opposite edge when the aligned edge is near the viewport edge
    //    and the popup is larger than the trigger (topRight -> topLeft).
    const identity = Object.fromEntries(POSITIONS.map((p) => [p, p]));
    const anchors: [string, [number, number], Record<string, string>][] = [
        ['居中，四周空间都够', [190, 140], identity],
        [
            '靠上 (上方 10 < 58)',
            [190, 10],
            {
                ...identity,
                top: 'bottom',
                topLeft: 'bottomLeft',
                topRight: 'bottomRight',
                left: 'leftTop',
                leftBottom: 'leftTop',
                right: 'rightTop',
                rightBottom: 'rightTop',
            },
        ],
        [
            '靠下 (下方 10 < 58)',
            [190, 270],
            {
                ...identity,
                bottom: 'top',
                bottomLeft: 'topLeft',
                bottomRight: 'topRight',
                left: 'leftBottom',
                leftTop: 'leftBottom',
                right: 'rightBottom',
                rightTop: 'rightBottom',
            },
        ],
        [
            '靠左 (左侧 10 < 108)',
            [10, 140],
            {
                ...identity,
                top: 'topLeft',
                topRight: 'topLeft',
                bottom: 'bottomLeft',
                bottomRight: 'bottomLeft',
                left: 'right',
                leftTop: 'rightTop',
                leftBottom: 'rightBottom',
            },
        ],
        [
            '靠右 (右侧 10 < 108)',
            [370, 140],
            {
                ...identity,
                top: 'topRight',
                topLeft: 'topRight',
                bottom: 'bottomRight',
                bottomLeft: 'bottomRight',
                right: 'left',
                rightTop: 'leftTop',
                rightBottom: 'leftBottom',
            },
        ],
        [
            '左上角',
            [10, 10],
            {
                top: 'bottomLeft',
                topLeft: 'bottomLeft',
                topRight: 'bottomLeft',
                bottom: 'bottomLeft',
                bottomLeft: 'bottomLeft',
                bottomRight: 'bottomLeft',
                left: 'rightTop',
                leftTop: 'rightTop',
                leftBottom: 'rightTop',
                right: 'rightTop',
                rightTop: 'rightTop',
                rightBottom: 'rightTop',
            },
        ],
        [
            '右下角',
            [370, 270],
            {
                top: 'topRight',
                topLeft: 'topRight',
                topRight: 'topRight',
                bottom: 'topRight',
                bottomLeft: 'topRight',
                bottomRight: 'topRight',
                left: 'leftBottom',
                leftTop: 'leftBottom',
                leftBottom: 'leftBottom',
                right: 'leftBottom',
                rightTop: 'leftBottom',
                rightBottom: 'leftBottom',
            },
        ],
    ];

    const rows = anchors.flatMap(([name, [x, y], expected]) => POSITIONS.map((position): [string, string, [number, number], string] => [name, position, [x, y], expected[position]]));

    it.each(rows)('%s：%s -> %s', (_name, position, [x, y], expected) => {
        expect(run(position, rect(x, y, 20, 20)).position).toBe(expected);
    });

    it('居中时四个方向都不溢出', () => {
        for (const position of POSITIONS) {
            const result = run(position, rect(190, 140, 20, 20));
            expect(result).toEqual({ position, isHeightOverFlow: false, isWidthOverFlow: false });
        }
    });

    it.each([
        // Neither above nor below fits: no flip, vertical overflow is reported and calcPosStyle pins it to the edge
        ['top', { width: 100, height: 200 }, { position: 'top', isHeightOverFlow: true, isWidthOverFlow: false }],
        ['bottom', { width: 100, height: 200 }, { position: 'bottom', isHeightOverFlow: true, isWidthOverFlow: false }],
        // Neither left nor right fits: no flip, horizontal overflow
        ['left', { width: 300, height: 50 }, { position: 'left', isHeightOverFlow: false, isWidthOverFlow: true }],
        ['right', { width: 300, height: 50 }, { position: 'right', isHeightOverFlow: false, isWidthOverFlow: true }],
    ])('两侧都放不下 %s: 不翻转并标记溢出', (position, wrapperRect, expected) => {
        // Trigger is centered: 140 on each vertical side < 50 + 200 + 8, 190 on each horizontal side < 300 + 8
        expect(run(position, rect(190, 140, 20, 20), { wrapperRect })).toEqual(expected);
    });

    it('弹层宽或高为 0 时不做任何调整', () => {
        expect(run('top', rect(190, 10, 20, 20), { wrapperRect: { width: 0, height: 50 } })).toEqual({
            position: 'top',
            isHeightOverFlow: false,
            isWidthOverFlow: false,
        });
        expect(run('left', rect(10, 140, 20, 20), { wrapperRect: { width: 100, height: 0 } }).position).toBe('left');
    });

    it('触发元素被视口左右截断时标记横向溢出', () => {
        // clientRight < 0: trigger lies entirely left of the viewport
        expect(run('bottom', rect(-50, 140, 20, 20)).isWidthOverFlow).toBe(true);
        // restClientRight < 0: trigger right edge is past the viewport
        expect(run('bottom', rect(390, 140, 20, 20)).isWidthOverFlow).toBe(true);
        expect(run('right', rect(190, -50, 20, 20)).isHeightOverFlow).toBe(true);
        expect(run('right', rect(190, 310, 20, 20)).isHeightOverFlow).toBe(true);
    });

    it.each([
        // Over family: the popup covers the trigger, so only the popup size and the trigger's distance to the viewport edges matter
        // restClientTop = 30 < 58 and clientBottom = 290 > 58 -> vertical flip
        ['leftTopOver', [190, 270], 'leftBottomOver'],
        // restClientLeft = 30 < 100 and clientRight = 390 > 100 -> horizontal flip; restClientTop = 160 is enough vertically
        ['leftTopOver', [370, 140], 'rightTopOver'],
        // clientBottom = 30 < 58 and restClientTop = 290 > 58 -> vertical flip
        ['rightBottomOver', [190, 10], 'rightTopOver'],
        // clientRight = 30 < 100 and restClientLeft = 390 > 100 -> horizontal flip
        ['rightTopOver', [10, 140], 'leftTopOver'],
        ['leftBottomOver', [190, 140], 'leftBottomOver'],
    ])('Over 系 %s @ %j -> %s', (position, [x, y], expected) => {
        expect(run(position, rect(x, y, 20, 20)).position).toBe(expected);
    });
});

describe('adjustPosition: 阈值附近差 1px', () => {
    // 'top' flips when clientTop - marginTop < H + spacing and restClientBottom - marginBottom > H + spacing.
    // H + spacing = 50 + 8 = 58, so clientTop = 57 flips and 58 does not
    it.each([
        [57, 'bottom'],
        [58, 'top'],
    ])('top: 触发元素顶部 %i 时为 %s', (top, expected) => {
        expect(run('top', rect(190, top, 20, 20)).position).toBe(expected);
    });

    // The reverse space must be strictly larger than needed: at viewport height 88 restClientBottom = 88 - 30 = 58 is not enough; at 89 it is 59 and flips
    it.each([
        [88, 'top'],
        [89, 'bottom'],
    ])('top: 视口高 %i 时反向空间刚好够不够，为 %s', (height, expected) => {
        const result = run('top', rect(190, 10, 20, 20), {
            viewport: { width: 400, height },
            containerRect: { left: 0, top: 0, right: 400, bottom: height },
        });
        expect(result.position).toBe(expected);
    });

    it.each([
        // bottom flips when restClientBottom < 58. Viewport height 300: top 221 -> bottom = 241, rest = 59 stays; 222 -> 58 stays (strictly less); 223 -> 57 flips
        [221, 'bottom'],
        [222, 'bottom'],
        [223, 'top'],
    ])('bottom: 触发元素顶部 %i 时为 %s', (top, expected) => {
        expect(run('bottom', rect(190, top, 20, 20)).position).toBe(expected);
    });

    it.each([
        // left flips when clientLeft < 108
        [107, 'right'],
        [108, 'left'],
    ])('left: 触发元素左侧 %i 时为 %s', (left, expected) => {
        expect(run('left', rect(left, 140, 20, 20)).position).toBe(expected);
    });

    it.each([
        // right flips when restClientRight < 108. Right edge = left + 20, rest = 400 - right edge
        [271, 'right'], // right edge 291, rest = 109 is enough
        [272, 'right'], // right edge 292, rest = 108, only strictly less flips
        [273, 'left'], // right edge 293, rest = 107 flips
    ])('right: 触发元素左侧 %i 时为 %s', (left, expected) => {
        expect(run('right', rect(left, 140, 20, 20)).position).toBe(expected);
    });

    it.each([
        // Numeric margin counts in clientTop - margin. With margin 10: 67 - 10 = 57 < 58 flips, 68 - 10 = 58 does not
        [67, 'bottom'],
        [68, 'top'],
    ])('margin 10: top 触发元素顶部 %i 时为 %s', (top, expected) => {
        expect(run('top', rect(190, top, 20, 20), { margin: 10 }).position).toBe(expected);
    });

    it.each([
        // Object margin: only marginTop affects top
        [67, 'bottom'],
        [68, 'top'],
    ])('marginTop 10 其余 0: top 触发元素顶部 %i 时为 %s', (top, expected) => {
        const margin = { marginLeft: 0, marginTop: 10, marginRight: 0, marginBottom: 0 };
        expect(run('top', rect(190, top, 20, 20), { margin }).position).toBe(expected);
    });

    it.each([
        // Object spacing: top/bottom use y, need 50 + 20 = 70; 69 flips, 70 does not
        [69, 'bottom'],
        [70, 'top'],
    ])('spacing {x:8,y:20}: top 触发元素顶部 %i 时为 %s', (top, expected) => {
        expect(run('top', rect(190, top, 20, 20), { spacing: { x: 8, y: 20 } }).position).toBe(expected);
    });

    it.each([
        // Object spacing: left/right use x, need 100 + 30 = 130; 129 flips, 130 does not
        [129, 'right'],
        [130, 'left'],
    ])('spacing {x:30,y:8}: left 触发元素左侧 %i 时为 %s', (left, expected) => {
        expect(run('left', rect(left, 140, 20, 20), { spacing: { x: 30, y: 8 } }).position).toBe(expected);
    });

    it.each([
        // left expands toward the top edge when clientBottom - halfHeight < H / 2.
        // Trigger 20×20, top = 12: bottom = 32, 32 - 10 = 22 < 50 / 2 = 25 expands to leftTop
        [12, 'leftTop'],
        // top = 15: 35 - 10 = 25 is not less than 25, no expansion
        [15, 'left'],
    ])('left 在上边缘附近: 触发元素顶部 %i 时为 %s', (top, expected) => {
        expect(run('left', rect(190, top, 20, 20)).position).toBe(expected);
    });
});

describe('adjustPosition: 容器与视口一起判断', () => {
    // Viewport 400×120, trigger (190,50)-(210,70): above 50 < 58 and below 120 - 70 = 50 < 58, neither viewport side fits
    const trigger = rect(190, 50, 20, 20);
    const shortViewport = { viewport: { width: 400, height: 120 } };

    it('视口两侧都放不下，容器下方有空间时翻到 bottom', () => {
        expect(run('top', trigger, { ...shortViewport, containerRect: { left: 0, top: 0, right: 400, bottom: 300 } }).position).toBe('bottom');
    });

    it('视口两侧都放不下，容器也没有空间时保持 top 并标记溢出', () => {
        expect(run('top', trigger, { ...shortViewport, containerRect: { left: 0, top: 0, right: 400, bottom: 120 } })).toEqual({ position: 'top', isHeightOverFlow: true, isWidthOverFlow: false });
    });

    it('视口空间足够时，容器反向有空间也不翻转', () => {
        // Container (100,100)-(300,260), trigger (190,150): inside the container above 50 < 58 and below 260 - 170 = 90 > 58,
        // but the viewport has 150 above, so no flip is needed
        expect(run('top', rect(190, 150, 20, 20), { containerRect: { left: 100, top: 100, right: 300, bottom: 260 } }).position).toBe('top');
    });
});

describe('adjustPosition: 旧 Cypress 用例 adjustPosIfNeed (视口 400×200)', () => {
    // Four Tag groups (topLeft/top/topRight, leftTop/left/leftBottom, rightTop/right/rightBottom,
    // bottomLeft/bottom/bottomRight) with a two-line popup.
    // Popup is estimated at 200×56 (text about 190 wide, two 20px lines plus 8 vertical padding), Tag at 36×24, spacing 8, margin 0.
    // Vertical need is 56 + 8 = 64, horizontal need is 200 + 8 = 208.
    // Layout: outer paddingLeft 40, top row marginLeft 40, left column 40 wide floated, right column marginLeft 180,
    // bottom row clear: both, 8 margin between Tags. The Storybook iframe adds P = 16px padding; P = 0 means none.
    // Expected: clicking topAndLeft[i] yields bottomAndRight[i] and vice versa.
    // Derivations are in each group comment. Sizes are estimates, every check is at least 4px from its threshold.
    const viewport = { width: 400, height: 200 };
    const wrapperRect = { width: 200, height: 56 };
    const layout = (padding: number) => {
        const p = padding;
        const topRow = [p + 80, p + 124, p + 168].map((x) => rect(x, p, 36, 24));
        const leftCol = [p + 24, p + 56, p + 88].map((y) => rect(p + 40, y, 36, 24));
        const rightCol = [p + 24, p + 56, p + 88].map((y) => rect(p + 220, y, 36, 24));
        const bottomRow = [p + 80, p + 124, p + 168].map((x) => rect(x, p + 120, 36, 24));
        // Container is body: content height plus vertical padding
        const containerRect = { left: 0, top: 0, right: 400, bottom: 2 * p + 144 };
        return { topRow, leftCol, rightCol, bottomRow, containerRect };
    };

    describe.each([[16], [0]])('Storybook 内边距 %ipx', (padding) => {
        const { topRow, leftCol, rightCol, bottomRow, containerRect } = layout(padding);
        const cases: [string, AdjustRect, string][] = [
            // Top row: above padding + 0 <= 16 < 64, below 200 - 24 - padding >= 160 > 64 -> top family flips to bottom family;
            // horizontally restClientLeft >= 232 > 200, so no edge realignment
            ['topLeft', topRow[0], 'bottomLeft'],
            ['top', topRow[1], 'bottom'],
            ['topRight', topRow[2], 'bottomRight'],
            // Left column: left padding + 40 <= 56 < 208, right 400 - (padding + 76) >= 308 > 208 -> left family flips to right family;
            // vertically the Tag is >= 72 > 56 above the viewport bottom, so no edge realignment
            ['leftTop', leftCol[0], 'rightTop'],
            ['left', leftCol[1], 'right'],
            ['leftBottom', leftCol[2], 'rightBottom'],
            // Bottom row: below 200 - (padding + 144) <= 56 < 64, above >= 120 > 64 -> bottom family flips to top family
            ['bottomLeft', bottomRow[0], 'topLeft'],
            ['bottom', bottomRow[1], 'top'],
            ['bottomRight', bottomRow[2], 'topRight'],
            // Right column: right 400 - (padding + 256) >= 128 < 208, left padding + 220 > 208 -> right family flips to left family
            ['rightTop', rightCol[0], 'leftTop'],
            ['right', rightCol[1], 'left'],
            ['rightBottom', rightCol[2], 'leftBottom'],
        ];

        it.each(cases)('%s -> %s', (position, triggerRect, expected) => {
            const result = adjustPosition({
                position,
                triggerRect,
                wrapperRect,
                containerRect,
                viewport,
                spacing: 8,
                margin: 0,
            });
            expect(result.position).toBe(expected);
        });
    });
});
