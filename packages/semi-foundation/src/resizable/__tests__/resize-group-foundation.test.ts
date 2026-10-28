import { describe, expect, it } from 'vite-plus/test';
import { ResizeGroupFoundation, type ResizeGroupAdapter } from '../group';

/**
 * #3336: a group mounted in display:none gets a `- 0px` handler offset and must recalculate once visible.
 * The jsdom ResizeObserver mock never fires, so handleGroupResize is driven directly.
 */
interface MockElement {
    offsetWidth: number;
    offsetHeight: number;
}

function createMockAdapter({ groupEl, handlerEls, itemEls, direction }: { groupEl: MockElement; handlerEls: MockElement[]; itemEls: MockElement[]; direction: string }) {
    return {
        getProp: (key: string) => ({ direction })[key],
        getProps: () => ({ direction }),
        getState: () => undefined,
        getStates: () => ({}),
        getContext: () => undefined,
        getContexts: () => ({}),
        getGroupRef: () => groupEl,
        getHandler: (i: number) => handlerEls[i],
        getHandlerCount: () => handlerEls.length,
        getItem: (i: number) => itemEls[i],
        getItemCount: () => itemEls.length,
        getItemMin: () => undefined,
        getItemMax: () => undefined,
        getItemDefaultSize: () => undefined,
        getItemStart: () => undefined,
        getItemChange: () => undefined,
        getItemEnd: () => undefined,
    } as unknown as ResizeGroupAdapter;
}

const noBox = Object.fromEntries(['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'].map((key) => [key, '0px']).concat(['borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'].map((key) => [key, '0px'])));
const makeEl = (size: number) => ({
    offsetWidth: size,
    offsetHeight: size,
    style: {} as { height?: string },
    id: '',
    setAttribute() {},
    ownerDocument: { defaultView: { getComputedStyle: () => noBox } },
});

describe('ResizeGroupFoundation.handleDirectionChange', () => {
    it('把项的尺寸移到新轴，并按手柄在新轴上的长度重新扣除手柄占用的空间', () => {
        const style = () => {
            const values: Record<string, string> = { width: 'calc(50% - 4px)' };
            return Object.assign(values, {
                removeProperty: (name: string) => {
                    delete values[name];
                },
            }) as unknown as { width?: string; height?: string; removeProperty: (name: string) => void };
        };
        const groupEl = makeEl(100);
        const handlerEls = [{ ...makeEl(0), offsetWidth: 8, offsetHeight: 20 }];
        const itemEls = [
            { ...makeEl(0), style: style() },
            { ...makeEl(0), style: style() },
        ];
        const adapter = createMockAdapter({ groupEl, handlerEls, itemEls, direction: 'horizontal' });
        const foundation = new ResizeGroupFoundation(adapter);
        foundation.init();
        expect(itemEls[0].style.width).toBe('calc(50% - 4px)');

        adapter.getProp = (() => 'vertical') as ResizeGroupAdapter['getProp'];
        foundation.handleDirectionChange();

        expect(itemEls.map((item) => item.style.height)).toEqual(['calc(50% - 10px)', 'calc(50% - 10px)']);
        expect(itemEls.map((item) => item.style.width)).toEqual([undefined, undefined]);
    });
});

describe('ResizeGroupFoundation 变为可见后重新计算 (#3336)', () => {
    it('分组可测量后，带上 handler 偏移重新计算子项尺寸', () => {
        const groupEl = makeEl(0);
        const handlerEls = [makeEl(0)];
        const itemEls = [makeEl(0), makeEl(0)];
        const adapter = createMockAdapter({ groupEl, handlerEls, itemEls, direction: 'vertical' });
        const foundation = new ResizeGroupFoundation(adapter);

        foundation.init();

        expect(itemEls[0].style.height).toContain('- 0px');
        expect(itemEls[1].style.height).toContain('- 0px');

        groupEl.offsetHeight = 100;
        groupEl.offsetWidth = 100;
        handlerEls[0].offsetHeight = 10;
        handlerEls[0].offsetWidth = 10;

        foundation.handleGroupResize();

        expect(itemEls[0].style.height).toBe('calc(50% - 5px)');
        expect(itemEls[1].style.height).toBe('calc(50% - 5px)');
    });

    it('后续缩放时不重新运行 initSpace（保留用户拖拽结果）', () => {
        const groupEl = makeEl(100);
        const handlerEls = [makeEl(10)];
        const itemEls = [makeEl(50), makeEl(50)];
        const adapter = createMockAdapter({ groupEl, handlerEls, itemEls, direction: 'vertical' });
        const foundation = new ResizeGroupFoundation(adapter);

        foundation.init();

        itemEls[0].style.height = 'calc(70% - 5px)';
        itemEls[1].style.height = 'calc(30% - 5px)';

        groupEl.offsetHeight = 200;
        foundation.handleGroupResize();

        expect(itemEls[0].style.height).toBe('calc(70% - 5px)');
        expect(itemEls[1].style.height).toBe('calc(30% - 5px)');
    });
});
