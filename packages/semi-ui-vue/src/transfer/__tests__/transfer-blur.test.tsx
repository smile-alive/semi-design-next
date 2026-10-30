/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import Transfer from '..';
import { FormTransfer } from '../../form';
import { renderForm } from '../../form/__tests__/fixtures/fields';

const dataSource = [
    { label: 'Alice', value: 'a', key: 'a' },
    { label: 'Bob', value: 'b', key: 'b' },
];

const outside = document.createElement('button');
outside.textContent = 'outside';

const mountOutside = () => document.body.append(outside);

afterEach(() => outside.remove());

describe('Transfer blur', () => {
    it('焦点在内部控件之间移动不触发，移到外部才触发一次', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(Transfer, { props: { dataSource, defaultValue: ['a'], onBlur } });
        mountOutside();
        const user = userEvent.setup();
        await user.click(screen.getByRole('textbox'));
        await user.click(within(screen.getByRole('list', { name: zh_CN.Transfer.optionList })).getAllByRole('checkbox')[1]);
        await user.tab();
        expect(onBlur).not.toHaveBeenCalled();
        await user.click(outside);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onBlur.mock.lastCall?.[0].relatedTarget).toBe(outside);
    });

    it('窗口失焦（relatedTarget 为空）时也触发', async () => {
        const onBlur = vi.fn<(event: FocusEvent) => void>();
        render(Transfer, { props: { dataSource, onBlur } });
        const input = screen.getByRole('textbox');
        await userEvent.click(input);
        input.blur();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

describe('FormTransfer trigger="blur"', () => {
    it('焦点离开后校验并标记 touched', async () => {
        const { api } = renderForm({}, () => <FormTransfer field="members" label="Members" dataSource={dataSource} trigger="blur" rules={[{ required: true, type: 'array', message: 'pick one' }]} />);
        mountOutside();
        await userEvent.click(screen.getByRole('textbox'));
        expect(screen.queryByText('pick one')).toBeNull();
        expect(api().getTouched('members')).toBeUndefined();
        await userEvent.click(outside);
        await waitFor(() => expect(screen.getByText('pick one')).toBeInTheDocument());
        expect(api().getTouched('members')).toBe(true);
    });
});
