import { useRef } from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { Form, ArrayField } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

describe('ArrayField 索引插入', () => {
    afterEach(cleanup);

    function ArrayFieldInsertDemo({ initialValues = { tasks: [{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }] } }) {
        const formApiRef = useRef<FormApi | null>(null);

        return (
            <Form
                getFormApi={(api) => {
                    formApiRef.current = api;
                }}
                initValues={initialValues}
            >
                <ArrayField field="tasks">
                    {({ add, addWithInitValue, arrayFields }) => (
                        <>
                            <button data-testid="add-default" onClick={() => add()}>
                                add()
                            </button>
                            <button data-testid="add-at-0" onClick={() => add(0)}>
                                add(0)
                            </button>
                            <button data-testid="add-at-1" onClick={() => add(1)}>
                                add(1)
                            </button>
                            <button data-testid="add-at-end" onClick={() => add(arrayFields.length)}>
                                add(end)
                            </button>
                            <button data-testid="add-out-of-range" onClick={() => add(100)}>
                                add(100)
                            </button>
                            <button data-testid="add-negative" onClick={() => add(-5)}>
                                add(-5)
                            </button>
                            <button data-testid="add-with-init-at-0" onClick={() => addWithInitValue({ name: 'inserted' }, 0)}>
                                addWithInitValue(0)
                            </button>
                            <button data-testid="add-with-init-default" onClick={() => addWithInitValue({ name: 'appended' })}>
                                addWithInitValue()
                            </button>
                            <button
                                data-testid="get-values"
                                onClick={() => {
                                    const val = formApiRef.current?.getValue('tasks');
                                    document.getElementById('form-values').textContent = JSON.stringify(val);
                                }}
                            >
                                getValues
                            </button>
                            {arrayFields.map(({ field, key, remove }, index) => (
                                <div key={key} data-testid={`task-${index}`}>
                                    <Form.Input field={`${field}[name]`} noLabel />
                                    <button data-testid={`remove-${index}`} onClick={remove}>
                                        remove
                                    </button>
                                </div>
                            ))}
                            <div data-testid="count">{arrayFields.length}</div>
                        </>
                    )}
                </ArrayField>
                <div id="form-values" data-testid="form-values" />
            </Form>
        );
    }

    it('不传 index 时 add() 追加到末尾', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);
        expect(getByTestId('count').textContent).toBe('3');

        fireEvent.click(getByTestId('add-default'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toEqual({ name: 'task-0' });
        expect(values[1]).toEqual({ name: 'task-1' });
        expect(values[2]).toEqual({ name: 'task-2' });
    });

    it('add(0) 插入到开头，且不移动已有值', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-at-0'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toBeNull();
        expect(values[1]).toEqual({ name: 'task-0' });
        expect(values[2]).toEqual({ name: 'task-1' });
        expect(values[3]).toEqual({ name: 'task-2' });
    });

    it('add(1) 插入到索引 1，且不移动已有值', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-at-1'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toEqual({ name: 'task-0' });
        expect(values[1]).toBeNull();
        expect(values[2]).toEqual({ name: 'task-1' });
        expect(values[3]).toEqual({ name: 'task-2' });
    });

    it('add(length) 的行为与追加一致', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-at-end'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toEqual({ name: 'task-0' });
        expect(values[1]).toEqual({ name: 'task-1' });
        expect(values[2]).toEqual({ name: 'task-2' });
    });

    it('add(100) 超出范围时截断到末尾', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-out-of-range'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toEqual({ name: 'task-0' });
        expect(values[1]).toEqual({ name: 'task-1' });
        expect(values[2]).toEqual({ name: 'task-2' });
    });

    it('add(-5) 负索引截断为 0', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-negative'));
        expect(getByTestId('count').textContent).toBe('4');

        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values[0]).toBeNull();
        expect(values[1]).toEqual({ name: 'task-0' });
        expect(values[2]).toEqual({ name: 'task-1' });
        expect(values[3]).toEqual({ name: 'task-2' });
    });

    it('空数组上 add() 可以正常工作', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo initialValues={{ tasks: [] }} />);
        expect(getByTestId('count').textContent).toBe('0');

        fireEvent.click(getByTestId('add-default'));
        expect(getByTestId('count').textContent).toBe('1');
    });

    it('空数组上 add(0) 可以正常工作', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo initialValues={{ tasks: [] }} />);

        fireEvent.click(getByTestId('add-at-0'));
        expect(getByTestId('count').textContent).toBe('1');
    });

    it('带 index 的 addWithInitValue 在表单状态中把值插入到指定位置', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-with-init-at-0'));
        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values.length).toBe(4);
        expect(values[0]).toEqual({ name: 'inserted' });
        expect(values[1]).toEqual({ name: 'task-0' });
        expect(values[2]).toEqual({ name: 'task-1' });
        expect(values[3]).toEqual({ name: 'task-2' });
        ['inserted', 'task-0', 'task-1', 'task-2'].forEach((name, i) => {
            expect(getByTestId(`task-${i}`).querySelector('input')).toHaveValue(name);
        });
    });

    it('不带 index 的 addWithInitValue 在表单状态中追加值', () => {
        const { getByTestId } = render(<ArrayFieldInsertDemo />);

        fireEvent.click(getByTestId('add-with-init-default'));
        fireEvent.click(getByTestId('get-values'));
        const values = JSON.parse(getByTestId('form-values').textContent);
        expect(values.length).toBe(4);
        expect(values[0]).toEqual({ name: 'task-0' });
        expect(values[1]).toEqual({ name: 'task-1' });
        expect(values[2]).toEqual({ name: 'task-2' });
        expect(values[3]).toEqual({ name: 'appended' });
    });

    it('onClick={add} 接收事件对象时不出错', () => {
        const Demo = () => (
            <Form initValues={{ items: ['a', 'b'] }}>
                <ArrayField field="items">
                    {({ add, arrayFields }) => (
                        <>
                            <button data-testid="add-direct" onClick={add}>
                                add
                            </button>
                            <div data-testid="count">{arrayFields.length}</div>
                        </>
                    )}
                </ArrayField>
            </Form>
        );

        const { getByTestId } = render(<Demo />);
        expect(getByTestId('count').textContent).toBe('2');

        fireEvent.click(getByTestId('add-direct'));
        expect(getByTestId('count').textContent).toBe('3');
    });
});
