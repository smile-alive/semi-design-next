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

function createGroup({ groupEl, handlerEls, itemEls, direction }: { groupEl: MockElement; handlerEls: MockElement[]; itemEls: MockElement[]; direction: string }) {
    const adapter = {
        getProp: (key: string) => ({ direction })[key],
        getProps: () => ({ direction }),
        getState: () => undefined,
        getStates: () => ({}),
        getContext: () => undefined,
        getContexts: () => ({}),
        getGroupRef: () => groupEl,
    } as unknown as ResizeGroupAdapter;
    const foundation = new ResizeGroupFoundation(adapter);
    handlerEls.forEach((handler) => foundation.registerHandler(handler as unknown as HTMLDivElement));
    itemEls.forEach((element) =>
        foundation.registerItem({
            element: element as unknown as HTMLDivElement,
            min: () => undefined,
            max: () => undefined,
            defaultSize: () => undefined,
            notifyResizeStart: () => undefined,
            notifyResize: () => undefined,
            notifyResizeEnd: () => undefined,
        })
    );
    return { adapter, foundation };
}

const noBox = Object.fromEntries(['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'].map((key) => [key, '0px']).concat(['borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'].map((key) => [key, '0px'])));
// elements sort in creation order, as DOM order does in a rendered group
let created = 0;
function makeEl(size: number) {
    const order = created++;
    return {
        order,
        offsetWidth: size,
        offsetHeight: size,
        style: {} as { height?: string },
        id: '',
        setAttribute() {},
        compareDocumentPosition: (other: { order: number }) => (order < other.order ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING),
        ownerDocument: { defaultView: { getComputedStyle: () => noBox } },
    };
}

describe('ResizeGroupFoundation.handlePropsChange', () => {
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
        const { adapter, foundation } = createGroup({ groupEl, handlerEls, itemEls, direction: 'horizontal' });
        foundation.init();
        expect(itemEls[0].style.width).toBe('calc(50% - 4px)');

        adapter.getProp = (() => 'vertical') as ResizeGroupAdapter['getProp'];
        foundation.handlePropsChange();

        expect(itemEls.map((item) => item.style.height)).toEqual(['calc(50% - 10px)', 'calc(50% - 10px)']);
        expect(itemEls.map((item) => item.style.width)).toEqual([undefined, undefined]);
    });
});

describe('ResizeGroupFoundation 变为可见后重新计算 (#3336)', () => {
    it('分组可测量后，带上 handler 偏移重新计算子项尺寸', () => {
        const groupEl = makeEl(0);
        const handlerEls = [makeEl(0)];
        const itemEls = [makeEl(0), makeEl(0)];
        const { foundation } = createGroup({ groupEl, handlerEls, itemEls, direction: 'vertical' });

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
        const { foundation } = createGroup({ groupEl, handlerEls, itemEls, direction: 'vertical' });

        foundation.init();

        itemEls[0].style.height = 'calc(70% - 5px)';
        itemEls[1].style.height = 'calc(30% - 5px)';

        groupEl.offsetHeight = 200;
        foundation.handleGroupResize();

        expect(itemEls[0].style.height).toBe('calc(70% - 5px)');
        expect(itemEls[1].style.height).toBe('calc(30% - 5px)');
    });
});

describe('ResizeGroupFoundation 子项与手柄注册', () => {
    const makeGroup = () => {
        const groupEl = makeEl(100);
        const handler = makeEl(10);
        const [first, second] = [makeEl(50), makeEl(50)];
        const started: string[] = [];
        const adapter = {
            getProp: () => 'horizontal',
            getProps: () => ({ direction: 'horizontal' }),
            getState: () => undefined,
            getStates: () => ({}),
            getGroupRef: () => groupEl,
        } as unknown as ResizeGroupAdapter;
        const foundation = new ResizeGroupFoundation(adapter);
        const item = (name: string, element: MockElement) => ({
            element: element as unknown as HTMLDivElement,
            min: () => undefined,
            max: () => undefined,
            defaultSize: () => undefined,
            notifyResizeStart: () => {
                started.push(name);
            },
            notifyResize: () => undefined,
            notifyResizeEnd: () => undefined,
        });
        // registered against DOM order: a child inserted later registers last
        foundation.registerItem(item('second', second));
        foundation.registerItem(item('first', first));
        const unregisterHandler = foundation.registerHandler(handler as unknown as HTMLDivElement);
        foundation.init();
        return { foundation, handler: handler as unknown as HTMLDivElement, started, unregisterHandler };
    };

    it('按 DOM 顺序给子项编号，与注册顺序无关', () => {
        const { foundation, handler, started } = makeGroup();
        expect(foundation.resizeByKey(handler, { key: 'ArrowRight' } as KeyboardEvent)).toBe(true);
        expect(started).toEqual(['first', 'second']);
    });

    it('已注销的手柄不再触发缩放', () => {
        const { foundation, handler, started, unregisterHandler } = makeGroup();
        unregisterHandler();
        expect(foundation.resizeByKey(handler, { key: 'ArrowRight' } as KeyboardEvent)).toBe(false);
        expect(started).toEqual([]);
    });
});
