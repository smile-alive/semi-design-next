import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import AArrayFixture from './a-array-fixture.svelte';
import { settle } from './helpers';

function renderDemo(props: Record<string, unknown> = {}) {
    const view = render(AArrayFixture, { props });
    const click = async (testId: string) => {
        await fireEvent.click(view.getByTestId(testId));
        await settle();
    };
    const count = () => view.getByTestId('count').textContent;
    const values = async () => {
        await click('get-values');
        return JSON.parse(view.getByTestId('form-values').textContent ?? '') as unknown[];
    };
    return { ...view, click, count, values };
}

describe('ArrayField 索引插入', () => {
    it('不传 index 时 onAdd() 追加到末尾', async () => {
        const { click, count, values } = renderDemo();
        expect(count()).toBe('3');
        await click('add-default');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toEqual({ name: 'task-0' });
        expect(result[1]).toEqual({ name: 'task-1' });
        expect(result[2]).toEqual({ name: 'task-2' });
    });

    it('onAdd(0) 插入到开头，且不移动已有值', async () => {
        const { click, count, values } = renderDemo();
        await click('add-at-0');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toBeNull();
        expect(result[1]).toEqual({ name: 'task-0' });
        expect(result[2]).toEqual({ name: 'task-1' });
        expect(result[3]).toEqual({ name: 'task-2' });
    });

    it('onAdd(1) 插入到索引 1，且不移动已有值', async () => {
        const { click, count, values } = renderDemo();
        await click('add-at-1');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toEqual({ name: 'task-0' });
        expect(result[1]).toBeNull();
        expect(result[2]).toEqual({ name: 'task-1' });
        expect(result[3]).toEqual({ name: 'task-2' });
    });

    it('onAdd(length) 的行为与追加一致', async () => {
        const { click, count, values } = renderDemo();
        await click('add-at-end');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toEqual({ name: 'task-0' });
        expect(result[1]).toEqual({ name: 'task-1' });
        expect(result[2]).toEqual({ name: 'task-2' });
    });

    it('onAdd(100) 超出范围时截断到末尾', async () => {
        const { click, count, values } = renderDemo();
        await click('add-out-of-range');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toEqual({ name: 'task-0' });
        expect(result[1]).toEqual({ name: 'task-1' });
        expect(result[2]).toEqual({ name: 'task-2' });
    });

    it('onAdd(-5) 负索引截断为 0', async () => {
        const { click, count, values } = renderDemo();
        await click('add-negative');
        expect(count()).toBe('4');
        const result = await values();
        expect(result[0]).toBeNull();
        expect(result[1]).toEqual({ name: 'task-0' });
        expect(result[2]).toEqual({ name: 'task-1' });
        expect(result[3]).toEqual({ name: 'task-2' });
    });

    it('空数组上 onAdd() 可以正常工作', async () => {
        const { click, count } = renderDemo({ initValues: { tasks: [] } });
        expect(count()).toBe('0');
        await click('add-default');
        expect(count()).toBe('1');
    });

    it('空数组上 onAdd(0) 可以正常工作', async () => {
        const { click, count } = renderDemo({ initValues: { tasks: [] } });
        await click('add-at-0');
        expect(count()).toBe('1');
    });

    it('带 index 的 onAddWithInitValue 在表单状态中把值插入到指定位置', async () => {
        const { click, values } = renderDemo();
        await click('add-with-init-at-0');
        const result = await values();
        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ name: 'inserted' });
        expect(result[1]).toEqual({ name: 'task-0' });
        expect(result[2]).toEqual({ name: 'task-1' });
        expect(result[3]).toEqual({ name: 'task-2' });
        ['inserted', 'task-0', 'task-1', 'task-2'].forEach((name, i) => {
            expect(screen.getByTestId(`task-${i}`).querySelector('input')).toHaveValue(name);
        });
    });

    it('不带 index 的 onAddWithInitValue 在表单状态中追加值', async () => {
        const { click, values } = renderDemo();
        await click('add-with-init-default');
        const result = await values();
        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ name: 'task-0' });
        expect(result[1]).toEqual({ name: 'task-1' });
        expect(result[2]).toEqual({ name: 'task-2' });
        expect(result[3]).toEqual({ name: 'appended' });
    });

    it('onclick={onAdd} 接收事件对象时不出错，按追加处理', async () => {
        const { click, count } = renderDemo({ initValues: { tasks: ['a', 'b'] } });
        expect(count()).toBe('2');
        await click('add-direct');
        expect(count()).toBe('3');
    });
});
