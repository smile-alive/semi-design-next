import { Activity } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Button from '@fibrae/semi-ui-react/button';
import Dropdown from '../index';

const menu = (
    <Dropdown.Menu>
        <Dropdown.Item>first</Dropdown.Item>
        <Dropdown.Item>second</Dropdown.Item>
    </Dropdown.Menu>
);

describe('Activity 隐藏打开中的 Dropdown', () => {
    it('非受控时隐藏期间菜单不可见，重新显示后菜单仍打开，触发器保持 aria-expanded，点击外部能关闭', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Dropdown motion={false} render={menu} trigger="click">
                    <Button>trigger</Button>
                </Dropdown>
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(screen.getByRole('menu')).toBeVisible());

        rerender(view('hidden'));
        await act(async () => {});
        expect(screen.queryByRole('menu')).toBeNull();
        rerender(view('visible'));
        await act(async () => {});
        const trigger = screen.getByRole('button', { name: 'trigger' });
        expect(screen.getByRole('menu')).toBeVisible();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveClass(`${BASE_CLASS_PREFIX}-dropdown-showing`);

        await userEvent.click(document.body);
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});
