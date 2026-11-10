import { describe, expect, it, vi } from 'vite-plus/test';
import ArrayFieldRows from '../array-field-rows';
import type { FieldBridge } from '../interface';

interface Setup {
    keys?: string[];
    value?: unknown[];
    registered?: boolean;
    initValue?: unknown[];
}

function createRows({ keys = [], value = [], registered = true, initValue }: Setup = {}) {
    let updateKey = 1;
    const store = { registered };
    const bridge = {
        getArrayField: vi.fn<FieldBridge['getArrayField']>((field) => (store.registered ? { field, updateKey } : undefined)),
        getValue: vi.fn<FieldBridge['getValue']>(() => value),
        getInitValue: vi.fn<FieldBridge['getInitValue']>(() => ['form']),
        registerArrayField: vi.fn<FieldBridge['registerArrayField']>(),
        mountArrayField: vi.fn<FieldBridge['mountArrayField']>(),
        unRegisterArrayField: vi.fn<FieldBridge['unRegisterArrayField']>(),
        addArrayFieldRow: vi.fn<FieldBridge['addArrayFieldRow']>(() => ++updateKey),
        addArrayFieldRowWithValue: vi.fn<FieldBridge['addArrayFieldRowWithValue']>((_field, _row, index) => ({ index: Math.min(index ?? keys.length, keys.length), updateKey: ++updateKey })),
        removeArrayFieldRow: vi.fn<FieldBridge['removeArrayFieldRow']>(),
        moveArrayFieldRow: vi.fn<FieldBridge['moveArrayFieldRow']>(() => ++updateKey),
    };
    const host = { setKeys: vi.fn<(keys: string[]) => void>(), setShouldUseInitValue: vi.fn<(value: boolean) => void>(), cloneDeep: structuredClone };
    const formState = {};
    const rows = new ArrayFieldRows(bridge as unknown as FieldBridge, { field: 'rows', initValue, formValues: { rows: keys.length > 0 ? keys.map(() => 0) : value }, formState }, host);
    const renew = () => ++updateKey;
    return { rows, bridge, host, store, formState, renew, lastKeys: () => host.setKeys.mock.lastCall?.[0] };
}

describe('ArrayFieldRows', () => {
    it('挂载时已有注册项则读表单值，否则取 initValue；`initValue` 为空值时回退到表单值', () => {
        const kept = createRows({ keys: ['a', 'b'], initValue: [9] });
        expect(kept.rows.keys).toHaveLength(2);
        expect(kept.rows.shouldUseInitValue).toBe(false);

        const fresh = createRows({ registered: false, initValue: [9, 9, 9] });
        expect(fresh.rows.keys).toHaveLength(3);
        expect(fresh.rows.shouldUseInitValue).toBe(true);

        const fallback = createRows({ registered: false, keys: ['a'], initValue: null as unknown as unknown[] });
        expect(fallback.rows.keys).toHaveLength(1);
    });

    it('mount 与 register 用挂载时的重置值，改名后的 field 用自己的初值；已有注册项不重复注册', () => {
        const { rows, bridge, store } = createRows({ registered: false, initValue: [1, 2] });
        rows.mount();
        expect(bridge.mountArrayField).toHaveBeenCalledWith('rows', [1, 2]);
        rows.register('rows');
        expect(bridge.registerArrayField).toHaveBeenLastCalledWith('rows', [1, 2]);
        rows.register('other', [7]);
        expect(bridge.registerArrayField).toHaveBeenLastCalledWith('other', [7]);
        rows.register('third');
        expect(bridge.registerArrayField).toHaveBeenLastCalledWith('third', ['form']);
        store.registered = true;
        rows.register('fourth');
        expect(bridge.registerArrayField).toHaveBeenCalledTimes(3);
    });

    it('rename 注销上一次注册的路径，注册新路径并立刻同步；unmount 注销当前路径', () => {
        const { rows, bridge, host, store } = createRows({ keys: ['a'], value: [1, 2] });
        store.registered = false;
        rows.rename('next', true, [3]);
        expect(bridge.unRegisterArrayField).toHaveBeenLastCalledWith('rows', true);
        expect(bridge.registerArrayField).toHaveBeenLastCalledWith('next', [3]);
        expect(bridge.getValue).toHaveBeenLastCalledWith('next');
        expect(host.setKeys).toHaveBeenCalledTimes(1);
        rows.unmount(false);
        expect(bridge.unRegisterArrayField).toHaveBeenLastCalledWith('next', false);
    });

    it('rowValues 在表单状态变化前返回带初值的表单值，之后交给外层', () => {
        const { rows, formState } = createRows({ registered: false, initValue: [1] });
        expect(rows.rowValues(formState, { other: 1 }, 'parent')).toEqual({ other: 1, rows: [1] });
        expect(rows.rowValues({}, { other: 1 }, 'parent')).toBe('parent');
    });

    it('updateKey 变化时按表单值重建 key，沿用已有的 key；未变化时不动', () => {
        const { rows, host, renew } = createRows({ keys: ['a'], value: [1, 2] });
        rows.sync();
        expect(host.setKeys).toHaveBeenCalledTimes(1);
        expect(host.setKeys.mock.lastCall?.[0]).toEqual([expect.any(String), expect.any(String)]);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(false);
        rows.sync();
        expect(host.setKeys).toHaveBeenCalledTimes(1);
        renew();
        rows.sync();
        expect(host.setKeys).toHaveBeenCalledTimes(2);
    });

    it('add 把位置截断到行数内，非数字参数追加，自身写入的 updateKey 不触发重建', () => {
        const { rows, bridge, host, lastKeys } = createRows({ keys: ['a', 'b'] });
        const [first] = rows.keys;
        rows.add(9);
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', 2);
        expect(lastKeys()).toEqual([expect.any(String), expect.any(String), expect.any(String)]);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(true);
        expect(rows.shouldUseInitValue).toBe(true);
        rows.add(-3);
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', 0);
        expect(lastKeys()?.[1]).toBe(first);
        rows.add({ type: 'click' });
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', undefined);
        expect(lastKeys()).toHaveLength(5);
        const calls = host.setKeys.mock.calls.length;
        rows.sync();
        expect(host.setKeys).toHaveBeenCalledTimes(calls);
    });

    it('addWithInitValue 指定位置时在该处插入新 key，追加时留给下一次 sync', () => {
        const { rows, host, lastKeys } = createRows({ keys: ['a', 'b'] });
        const [first, second] = rows.keys;
        rows.addWithInitValue({ name: 'x' }, 1);
        expect(lastKeys()).toEqual([first, expect.any(String), second]);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(false);
        rows.addWithInitValue({ name: 'y' });
        expect(host.setKeys).toHaveBeenCalledTimes(1);
    });

    it('remove 删掉该行的 key，move 截断位置并让行带着 key 移动', () => {
        const { rows, bridge, host, lastKeys } = createRows({ keys: ['a', 'b', 'c'] });
        const [a, , c] = rows.keys;
        rows.remove(1);
        expect(bridge.removeArrayFieldRow).toHaveBeenLastCalledWith('rows', 1);
        expect(lastKeys()).toEqual([a, c]);
        rows.move(5, -1);
        expect(bridge.moveArrayFieldRow).toHaveBeenLastCalledWith('rows', 1, 0);
        expect(lastKeys()).toEqual([c, a]);
        rows.move(0, 0);
        expect(host.setKeys).toHaveBeenCalledTimes(2);
    });
});
