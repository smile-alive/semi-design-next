import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../../form/interface';
import Transfer from '../index';

const dataSource = [
    { label: 'Alice', value: 'a', key: 'a' },
    { label: 'Bob', value: 'b', key: 'b' },
];

describe('Transfer onBlur', () => {
    it('焦点在内部控件之间移动不触发，移到外部才触发一次', async () => {
        const onBlur = vi.fn<(e: React.FocusEvent<HTMLDivElement>) => void>();
        render(
            <>
                <Transfer defaultValue={['a']} dataSource={dataSource} onBlur={onBlur} />
                <button type="button">outside</button>
            </>
        );
        const user = userEvent.setup();
        await user.click(screen.getByRole('textbox'));
        await user.click(within(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).getAllByRole('checkbox')[1]);
        await user.tab();
        expect(onBlur).not.toHaveBeenCalled();
        const outside = screen.getByRole('button', { name: 'outside' });
        await user.click(outside);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.lastCall?.[0].relatedTarget).toBe(outside);
    });

    it('窗口失焦（relatedTarget 为空）时也触发', async () => {
        const onBlur = vi.fn<(e: React.FocusEvent<HTMLDivElement>) => void>();
        render(<Transfer dataSource={dataSource} onBlur={onBlur} />);
        const input = screen.getByRole('textbox');
        await userEvent.click(input);
        input.blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe('Form.Transfer trigger="blur"', () => {
    it('焦点离开后校验并标记 touched', async () => {
        let api!: FormApi;
        render(
            <>
                <Form getFormApi={(formApi) => (api = formApi)}>
                    <Form.Transfer dataSource={dataSource} field="members" label="Members" rules={[{ required: true, message: 'pick one' }]} trigger="blur" />
                </Form>
                <button type="button">outside</button>
            </>
        );
        await userEvent.click(screen.getByRole('textbox'));
        expect(screen.queryByText('pick one')).toBeNull();
        expect(api.getTouched('members')).toBeUndefined();
        await userEvent.click(screen.getByRole('button', { name: 'outside' }));
        await waitFor(() => expect(screen.getByText('pick one')).toBeInTheDocument());
        expect(api.getTouched('members')).toBe(true);
    });
});
