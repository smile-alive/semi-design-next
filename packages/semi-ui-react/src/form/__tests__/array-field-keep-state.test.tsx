import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { ArrayField, Button, Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

interface Row {
    name: string;
}

const rules = [{ pattern: /^.{2,}$/, message: 'too short' }];

function Rows({ show = true, keepState, initValue }: { show?: boolean; keepState?: boolean; initValue: Row[] }) {
    if (!show) {
        return null;
    }
    return (
        <ArrayField field="users" initValue={initValue} keepState={keepState}>
            {({ arrayFields, add, move }) => (
                <>
                    {arrayFields.map(({ key, field, remove }, index) => (
                        <div key={key}>
                            <Form.Input field={`${field}.name`} label={`row ${index}`} rules={rules} />
                            <Button onClick={remove}>{`remove ${index}`}</Button>
                        </div>
                    ))}
                    <Button onClick={add}>add</Button>
                    <Button onClick={() => move(1, 2)}>move 1 to 2</Button>
                    <Button onClick={() => move(0, 9)}>move 0 to end</Button>
                </>
            )}
        </ArrayField>
    );
}

function renderRows(props: { keepState?: boolean; initValue: Row[] }) {
    let api: FormApi;
    const form = (show: boolean) => (
        <Form
            getFormApi={(formApi) => {
                api = formApi;
            }}
        >
            <Rows {...props} show={show} />
        </Form>
    );
    const view = render(form(true));
    return { api: () => api, toggle: (show: boolean) => view.rerender(form(show)) };
}

const inputValues = () => screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value);
const validate = (api: FormApi) => act(() => api.validate().catch(() => undefined));

describe('ArrayField keepState', () => {
    it('默认整体卸载时保留行值、错误与触碰状态，再挂载时显示保留的值', async () => {
        const { api, toggle } = renderRows({ initValue: [{ name: 'aa' }, { name: 'bb' }] });
        await userEvent.type(screen.getByRole('textbox', { name: 'row 0' }), '{Backspace}');
        expect(api().getError('users[0].name')).toEqual(['too short']);
        toggle(false);
        expect(api().getValue('users')).toEqual([{ name: 'a' }, { name: 'bb' }]);
        expect(api().getError('users[0].name')).toEqual(['too short']);
        expect(api().getTouched('users[0].name')).toBe(true);
        toggle(true);
        expect(inputValues()).toEqual(['a', 'bb']);
        expect(screen.getByText('too short')).toBeInTheDocument();
    });

    it('keepState={false} 整体卸载时删除行值与状态，再挂载时回到 initValue', async () => {
        const { api, toggle } = renderRows({ keepState: false, initValue: [{ name: 'aa' }, { name: 'bb' }] });
        await userEvent.type(screen.getByRole('textbox', { name: 'row 1' }), 'x');
        toggle(false);
        expect(api().getValue('users')).toBeUndefined();
        expect(api().getTouched('users[1].name')).toBeUndefined();
        toggle(true);
        expect(inputValues()).toEqual(['aa', 'bb']);
    });

    it('删除中间行后，后续行的状态前移，新增行不会复活被删行的状态', async () => {
        const { api } = renderRows({ initValue: [{ name: 'aa' }, { name: 'b' }, { name: 'cc' }] });
        await validate(api());
        expect(api().getError('users[1].name')).toEqual(['too short']);
        await userEvent.click(screen.getByRole('button', { name: 'remove 1' }));
        expect(api().getValue('users')).toEqual([{ name: 'aa' }, { name: 'cc' }]);
        expect(api().getError('users[1].name')).toBeUndefined();
        await userEvent.click(screen.getByRole('button', { name: 'add' }));
        expect(api().getValue('users[2].name')).toBeUndefined();
        expect(api().getError('users[2].name')).toBeUndefined();
        expect(api().getTouched('users[2].name')).toBeUndefined();
        expect(inputValues()).toEqual(['aa', 'cc', '']);
    });
});

describe('ArrayField move', () => {
    it('move 把行的值、错误与触碰状态移到目标行，输入框随行移动，越界的下标取边界', async () => {
        const { api } = renderRows({ initValue: [{ name: 'aa' }, { name: 'b' }, { name: 'cc' }] });
        await validate(api());
        await userEvent.type(screen.getByRole('textbox', { name: 'row 0' }), 'x');
        await userEvent.click(screen.getByRole('button', { name: 'move 1 to 2' }));
        expect(api().getValue('users')).toEqual([{ name: 'aax' }, { name: 'cc' }, { name: 'b' }]);
        expect(api().getError('users[1].name')).toBeUndefined();
        expect(api().getError('users[2].name')).toEqual(['too short']);
        expect(inputValues()).toEqual(['aax', 'cc', 'b']);
        await userEvent.click(screen.getByRole('button', { name: 'move 0 to end' }));
        expect(api().getValue('users')).toEqual([{ name: 'cc' }, { name: 'b' }, { name: 'aax' }]);
        expect(api().getError('users[1].name')).toEqual(['too short']);
        expect(api().getTouched('users[2].name')).toBe(true);
        expect(inputValues()).toEqual(['cc', 'b', 'aax']);
        expect(screen.getAllByText('too short')).toHaveLength(1);
    });
});
