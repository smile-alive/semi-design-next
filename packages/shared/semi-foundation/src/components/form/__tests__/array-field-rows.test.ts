import { describe, expect, it, vi } from 'vite-plus/test';
import ArrayFieldRows from '../array-field-rows';
import type { FieldBridge } from '../interface';

function createRows(keys: string[], value: unknown[] = []) {
    let updateKey = 1;
    const bridge = {
        getArrayField: vi.fn<FieldBridge['getArrayField']>(() => ({ field: 'rows', updateKey })),
        getValue: vi.fn<FieldBridge['getValue']>(() => value),
        addArrayFieldRow: vi.fn<FieldBridge['addArrayFieldRow']>(() => ++updateKey),
        addArrayFieldRowWithValue: vi.fn<FieldBridge['addArrayFieldRowWithValue']>((_field, _row, index) => ({ index: Math.min(index ?? keys.length, keys.length), updateKey: ++updateKey })),
        removeArrayFieldRow: vi.fn<FieldBridge['removeArrayFieldRow']>(),
        moveArrayFieldRow: vi.fn<FieldBridge['moveArrayFieldRow']>(() => ++updateKey),
    };
    const host = { setKeys: vi.fn<(keys: string[]) => void>(), setShouldUseInitValue: vi.fn<(value: boolean) => void>() };
    const rows = new ArrayFieldRows(bridge as unknown as FieldBridge, keys, host);
    const renew = () => ++updateKey;
    return { rows, bridge, host, renew, lastKeys: () => host.setKeys.mock.lastCall?.[0] };
}

describe('ArrayFieldRows', () => {
    it('updateKey 变化时按表单值重建 key，沿用已有的 key；未变化时不动', () => {
        const { rows, host, renew } = createRows(['a'], [1, 2]);
        rows.sync('rows');
        expect(host.setKeys).toHaveBeenCalledTimes(1);
        expect(host.setKeys.mock.lastCall?.[0]).toEqual(['a', expect.any(String)]);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(false);
        rows.sync('rows');
        expect(host.setKeys).toHaveBeenCalledTimes(1);
        renew();
        rows.sync('rows');
        expect(host.setKeys).toHaveBeenCalledTimes(2);
    });

    it('add 把位置截断到行数内，非数字参数追加，自身写入的 updateKey 不触发重建', () => {
        const { rows, bridge, host, lastKeys } = createRows(['a', 'b']);
        rows.add('rows', 9);
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', 2);
        expect(lastKeys()).toEqual(['a', 'b', expect.any(String)]);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(true);
        rows.add('rows', -3);
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', 0);
        expect(lastKeys()[1]).toBe('a');
        rows.add('rows', { type: 'click' });
        expect(bridge.addArrayFieldRow).toHaveBeenLastCalledWith('rows', undefined);
        expect(lastKeys()).toHaveLength(5);
        const calls = host.setKeys.mock.calls.length;
        rows.sync('rows');
        expect(host.setKeys).toHaveBeenCalledTimes(calls);
    });

    it('addWithInitValue 指定位置时在该处插入新 key，追加时留给下一次 sync', () => {
        const { rows, host, lastKeys } = createRows(['a', 'b']);
        rows.addWithInitValue('rows', { name: 'x' }, 1);
        expect(lastKeys()).toEqual(['a', expect.any(String), 'b']);
        expect(host.setShouldUseInitValue).toHaveBeenLastCalledWith(false);
        rows.addWithInitValue('rows', { name: 'y' });
        expect(host.setKeys).toHaveBeenCalledTimes(1);
    });

    it('remove 删掉该行的 key，move 截断位置并让行带着 key 移动', () => {
        const { rows, bridge, host, lastKeys } = createRows(['a', 'b', 'c']);
        rows.remove('rows', 1);
        expect(bridge.removeArrayFieldRow).toHaveBeenLastCalledWith('rows', 1);
        expect(lastKeys()).toEqual(['a', 'c']);
        rows.move('rows', 5, -1);
        expect(bridge.moveArrayFieldRow).toHaveBeenLastCalledWith('rows', 1, 0);
        expect(lastKeys()).toEqual(['c', 'a']);
        rows.move('rows', 0, 0);
        expect(host.setKeys).toHaveBeenCalledTimes(2);
    });
});
