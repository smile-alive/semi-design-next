import { For } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { type FormApi, ArrayField, Form, FormInput } from '..';

describe('ArrayField 索引插入', () => {
    const renderDemo = (initValues: Record<string, any> = { tasks: [{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }] }) => {
        let formApi: FormApi | undefined;
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                <ArrayField field="tasks">
                    {(props) => (
                        <>
                            <button data-testid="add-default" onClick={() => props.add()}>
                                add()
                            </button>
                            <button data-testid="add-at-0" onClick={() => props.add(0)}>
                                add(0)
                            </button>
                            <button data-testid="add-at-1" onClick={() => props.add(1)}>
                                add(1)
                            </button>
                            <button data-testid="add-at-end" onClick={() => props.add(props.arrayFields.length)}>
                                add(end)
                            </button>
                            <button data-testid="add-out-of-range" onClick={() => props.add(100)}>
                                add(100)
                            </button>
                            <button data-testid="add-negative" onClick={() => props.add(-5)}>
                                add(-5)
                            </button>
                            <button data-testid="add-with-init-at-0" onClick={() => props.addWithInitValue({ name: 'inserted' }, 0)}>
                                addWithInitValue(0)
                            </button>
                            <button data-testid="add-with-init-default" onClick={() => props.addWithInitValue({ name: 'appended' })}>
                                addWithInitValue()
                            </button>
                            <For each={props.arrayFields}>
                                {(row, index) => (
                                    <div data-testid={`task-${index()}`}>
                                        <FormInput field={`${row.field}[name]`} noLabel />
                                        <button data-testid={`remove-${index()}`} onClick={row.remove}>
                                            remove
                                        </button>
                                    </div>
                                )}
                            </For>
                            <div data-testid="count">{props.arrayFields.length}</div>
                        </>
                    )}
                </ArrayField>
            </Form>
        ));
        return { values: () => formApi?.getValue('tasks') as unknown[] };
    };

    const click = (testId: string) => fireEvent.click(screen.getByTestId(testId));
    const count = () => screen.getByTestId('count').textContent;

    it('不传 index 时 add() 追加到末尾', () => {
        const { values } = renderDemo();
        expect(count()).toBe('3');
        click('add-default');
        expect(count()).toBe('4');
        expect(values().slice(0, 3)).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
    });

    it('add(0) 插入到开头，且不移动已有值', () => {
        const { values } = renderDemo();
        click('add-at-0');
        expect(count()).toBe('4');
        expect(values()[0]).toBeUndefined();
        expect(values().slice(1)).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
        ['', 'task-0', 'task-1', 'task-2'].forEach((name, i) => {
            expect(screen.getByTestId(`task-${i}`).querySelector('input')).toHaveValue(name);
        });
    });

    it('add(1) 插入到索引 1，且不移动已有值', () => {
        const { values } = renderDemo();
        click('add-at-1');
        expect(count()).toBe('4');
        expect(values()[0]).toEqual({ name: 'task-0' });
        expect(values()[1]).toBeUndefined();
        expect(values().slice(2)).toEqual([{ name: 'task-1' }, { name: 'task-2' }]);
    });

    it('add(length) 的行为与追加一致', () => {
        const { values } = renderDemo();
        click('add-at-end');
        expect(count()).toBe('4');
        expect(values().slice(0, 3)).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
    });

    it('add(100) 超出范围时截断到末尾', () => {
        const { values } = renderDemo();
        click('add-out-of-range');
        expect(count()).toBe('4');
        expect(values().slice(0, 3)).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
    });

    it('add(-5) 负索引截断为 0', () => {
        const { values } = renderDemo();
        click('add-negative');
        expect(count()).toBe('4');
        expect(values()[0]).toBeUndefined();
        expect(values().slice(1)).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
    });

    it('空数组上 add() 可以正常工作', () => {
        renderDemo({ tasks: [] });
        expect(count()).toBe('0');
        click('add-default');
        expect(count()).toBe('1');
    });

    it('空数组上 add(0) 可以正常工作', () => {
        renderDemo({ tasks: [] });
        click('add-at-0');
        expect(count()).toBe('1');
    });

    it('带 index 的 addWithInitValue 在表单状态中把值插入到指定位置', () => {
        const { values } = renderDemo();
        click('add-with-init-at-0');
        expect(values()).toEqual([{ name: 'inserted' }, { name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }]);
        ['inserted', 'task-0', 'task-1', 'task-2'].forEach((name, i) => {
            expect(screen.getByTestId(`task-${i}`).querySelector('input')).toHaveValue(name);
        });
    });

    it('不带 index 的 addWithInitValue 在表单状态中追加值', () => {
        const { values } = renderDemo();
        click('add-with-init-default');
        expect(values()).toEqual([{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }, { name: 'appended' }]);
        expect(screen.getByTestId('task-3').querySelector('input')).toHaveValue('appended');
    });

    it('onClick={add} 接收事件对象时不出错', () => {
        render(() => (
            <Form initValues={{ items: ['a', 'b'] }}>
                <ArrayField field="items">
                    {(props) => (
                        <>
                            <button data-testid="add-direct" onClick={props.add}>
                                add
                            </button>
                            <div data-testid="count">{props.arrayFields.length}</div>
                        </>
                    )}
                </ArrayField>
            </Form>
        ));
        expect(count()).toBe('2');
        click('add-direct');
        expect(count()).toBe('3');
    });
});
